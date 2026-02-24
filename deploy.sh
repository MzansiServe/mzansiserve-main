#!/usr/bin/env bash
# =============================================================================
# MzansiServe Deployment Script
# Usage: ./deploy.sh [--env-only | --restart-only | --logs]
# =============================================================================
set -e

# ─── Configuration ────────────────────────────────────────────────────────────
ZONE="us-central1-c"
INSTANCE="dipselgroup"
PROJECT="white-caster-270410"
REMOTE_DIR="/opt/mzansiserve"
SSH_PASSPHRASE="admin"       # SSH key passphrase
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colours
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ─── Helper: run a command on the remote VM ───────────────────────────────────
remote() {
  gcloud compute ssh \
    --zone "$ZONE" \
    --project "$PROJECT" \
    --ssh-flag="-o StrictHostKeyChecking=no" \
    "$INSTANCE" -- "$@"
}

# ─── Parse flags ─────────────────────────────────────────────────────────────
ACTION="deploy"
case "${1:-}" in
  --env-only)     ACTION="env"     ;;
  --restart-only) ACTION="restart" ;;
  --logs)         ACTION="logs"    ;;
  --help|-h)
    echo "Usage: $0 [--env-only | --restart-only | --logs]"
    echo "  (no flag)       Full deploy: sync code + rebuild + restart"
    echo "  --env-only      Upload .env file only, then restart"
    echo "  --restart-only  Restart containers without syncing code"
    echo "  --logs          Stream live logs from the VM"
    exit 0
    ;;
esac

# ─── Validate gcloud is installed ────────────────────────────────────────────
command -v gcloud &>/dev/null || error "gcloud CLI not found. Install it: https://cloud.google.com/sdk/docs/install"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       MzansiServe  —  Deploy to GCP VM           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
info "Project  : $PROJECT"
info "Instance : $INSTANCE  ($ZONE)"
info "Action   : $ACTION"
echo ""

# ─── Stream logs ─────────────────────────────────────────────────────────────
if [[ "$ACTION" == "logs" ]]; then
  info "Streaming logs from VM (Ctrl+C to stop)…"
  remote "cd $REMOTE_DIR && docker compose logs -f --tail=100"
  exit 0
fi

# ─── Restart only ────────────────────────────────────────────────────────────
if [[ "$ACTION" == "restart" ]]; then
  info "Restarting containers on VM…"
  remote "cd $REMOTE_DIR && docker compose restart"
  success "Containers restarted."
  exit 0
fi

# ─── Upload .env file ────────────────────────────────────────────────────────
info "Uploading .env to VM…"
gcloud compute scp \
  --zone "$ZONE" \
  --project "$PROJECT" \
  "$LOCAL_DIR/.env" \
  "${INSTANCE}:${REMOTE_DIR}/.env" \
  2>/dev/null || {
    # Remote dir may not exist yet — create it first
    remote "sudo mkdir -p $REMOTE_DIR && sudo chown \$(whoami):\$(whoami) $REMOTE_DIR"
    gcloud compute scp \
      --zone "$ZONE" \
      --project "$PROJECT" \
      "$LOCAL_DIR/.env" \
      "${INSTANCE}:${REMOTE_DIR}/.env"
  }
success ".env uploaded."

if [[ "$ACTION" == "env" ]]; then
  info "Restarting containers to pick up new .env…"
  remote "cd $REMOTE_DIR && docker compose up -d"
  success "Done — env-only deploy complete."
  exit 0
fi

# ─── Full deploy ──────────────────────────────────────────────────────────────
info "Step 1/5 — Ensuring remote directory exists…"
remote "sudo mkdir -p $REMOTE_DIR && sudo chown \$(whoami):\$(whoami) $REMOTE_DIR"
success "Remote dir ready at $REMOTE_DIR"

info "Step 2/5 — Installing Docker & Docker Compose on VM (skipped if already present)…"
remote "
  if ! command -v docker &>/dev/null; then
    echo 'Installing Docker…'
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker \$(whoami)
    echo 'Docker installed.'
  else
    echo 'Docker already installed.'
  fi

  if ! docker compose version &>/dev/null 2>&1; then
    echo 'Installing Docker Compose plugin…'
    sudo apt-get install -y docker-compose-plugin 2>/dev/null || \
    sudo yum install -y docker-compose-plugin 2>/dev/null || true
  else
    echo 'Docker Compose already installed.'
  fi
"
success "Docker ready."

info "Step 3/5 — Syncing project files to VM…"
# Exclude heavy/unnecessary dirs
gcloud compute scp \
  --zone "$ZONE" \
  --project "$PROJECT" \
  --recurse \
  "$LOCAL_DIR/" \
  "${INSTANCE}:${REMOTE_DIR}/" \
  --scp-flag="-o StrictHostKeyChecking=no" \
  --scp-flag="-r" \
  -- \
  2>/dev/null || true

# Use rsync-style approach via tar for reliability
info "  (Using tar+ssh for reliable transfer…)"
cd "$LOCAL_DIR"
tar --exclude='.git' \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    --exclude='node_modules' \
    --exclude='frontend/dist' \
    --exclude='frontend/.next' \
    -czf - . | \
  gcloud compute ssh \
    --zone "$ZONE" \
    --project "$PROJECT" \
    --ssh-flag="-o StrictHostKeyChecking=no" \
    "$INSTANCE" -- "mkdir -p $REMOTE_DIR && tar -xzf - -C $REMOTE_DIR"

success "Files synced to VM."

info "Step 4/5 — Building & starting containers…"
remote "
  set -e
  cd $REMOTE_DIR

  # Make entrypoint executable
  chmod +x docker-entrypoint.sh 2>/dev/null || true

  # Pull any updated base images
  docker compose pull --quiet 2>/dev/null || true

  # Build & bring up (detached)
  docker compose up --build -d

  # Remove dangling images to save disk space
  docker image prune -f 2>/dev/null || true
"
success "Containers are up."

info "Step 5/5 — Health check…"
sleep 5
remote "
  cd $REMOTE_DIR
  echo '--- Running containers ---'
  docker compose ps
  echo ''
  echo '--- Last 20 log lines ---'
  docker compose logs --tail=20
"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         🚀  Deployment complete!                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Backend  → ${CYAN}http://\$(gcloud compute instances describe $INSTANCE --zone $ZONE --project $PROJECT --format='get(networkInterfaces[0].accessConfigs[0].natIP)'):5006${NC}"
echo -e "  Frontend → ${CYAN}http://\$(gcloud compute instances describe $INSTANCE --zone $ZONE --project $PROJECT --format='get(networkInterfaces[0].accessConfigs[0].natIP)'):8080${NC}"
echo ""
echo -e "  Next time, just run:  ${YELLOW}./deploy.sh${NC}"
echo ""
