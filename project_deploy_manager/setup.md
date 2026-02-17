
---

## Technical spec (by script name)

**Conventions:**  
- **\_local:** run on the current machine (no SSH).  
- **\_remote:** run on a remote host via SSH (host, username, password/SSH_PASSWORD; optional port/timeout).  
- All scripts: support `-v`/`--verbose`, `-d`/`--debug`; log to stderr; exit 0 on success, non-zero on failure.

---

### Disk

| Script | Purpose |
|--------|--------|
| **check_disk_space_local** | Report disk usage on the local machine (e.g. `df -h`). Output: filesystem, size, used, avail, use%, mount; exit 0 if within thresholds (optional args), else non-zero. |
| **check_disk_space_remote** | Same as above, executed on the remote host via SSH. |
| **check_disk_memory_local** | Report memory usage on the local machine (e.g. `free` or `/proc/meminfo`). Output: total, used, free, etc.; exit 0 if within thresholds (optional), else non-zero. |
| **check_disk_memory_remote** | Same as above, executed on the remote host via SSH. |

---

### Docker Compose

| Script | Purpose |
|--------|--------|
| **docker_compose_check_installation_local** | Check if Docker Compose (e.g. `docker compose` or `docker-compose`) is available locally. Print true/false; exit 0 if installed, 1 if not. |
| **docker_compose_check_installation_remote** | Same check on the remote host via SSH. |
| **docker_compose_install_local** | Install Docker Compose on the local machine (plugin or standalone as per OS). Exit 0 on success. |
| **docker_compose_install_remote** | Install Docker Compose on the remote host via SSH. |
| **docker_compose_up_local** | Run `docker compose up -d` in the project directory (compose file path/configurable). Exit 0 on success. |
| **docker_compose_up_remote** | Same, on remote host: SSH, cd to project dir, run `docker compose up -d`. |
| **docker_compose_up_build_local** | Run `docker compose up -d --build` locally. |
| **docker_compose_up_build_remote** | Same, on remote host via SSH. |
| **docker_compose_up_build_with_replicas_local** | Run `docker compose up -d --build` with scale/replicas (service name and count as args). |
| **docker_compose_up_build_with_replicas_remote** | Same, on remote host via SSH. |
| **docker_compose_down_local** | Run `docker compose down` in the project directory. |
| **docker_compose_down_remote** | Same, on remote host via SSH. |
| **docker_compose_logs_follow_stream_local** | Run `docker compose logs -f` (optionally for a service); stream output to stdout until interrupted. |
| **docker_compose_logs_follow_stream_remote** | Same, on remote host; stream remote logs to local stdout. |
| **docker_compose_ps_local** | Run `docker compose ps`; print service status (name, state, ports). |
| **docker_compose_ps_remote** | Same, on remote host via SSH. |
| **docker_compose_volume_stats_local** | Report size/usage of volumes used by the compose project (e.g. `docker system df -v` filtered or volume inspect). |
| **docker_compose_volume_stats_remote** | Same, on remote host via SSH. |

---

### Docker

| Script | Purpose |
|--------|--------|
| **docker_check_install_local** | Check if Docker daemon/client is installed locally (e.g. `command -v docker` and optionally `docker info`). Print true/false; exit 0 if installed. |
| **docker_check_install_remote** | Same check on remote host via SSH. (Align with existing `check_docker.py`.) |
| **docker_install_local** | Install Docker on the local machine (get.docker.com or distro-specific). Exit 0 on success. |
| **docker_install_remote** | Install Docker on remote host via SSH. (Align with existing `install_docker.py`.) |
| **docker_ps_local** | Run `docker ps` (optionally `-a`); print container list (ID, image, status, ports). |
| **docker_ps_remote** | Same, on remote host via SSH. |
| **docker_volume_stats_local** | Report Docker volume usage (e.g. `docker system df -v` or volume ls/inspect). |
| **docker_volume_stats_remote** | Same, on remote host via SSH. |
| **docker_stream_logs_local** | Run `docker logs -f <container>`; stream container logs to stdout until interrupted. Container ID/name as arg. |
| **docker_stream_logs_remote** | Same, on remote host; stream remote container logs to local stdout. |
| **docker_list_all_images_local** | Run `docker images` (optionally `-a`); print image list (repo, tag, id, size). |
| **docker_list_all_images_remote** | Same, on remote host via SSH. |
| **docker_scp_image_to_remote** | Save image on local (or source) host, copy to remote (e.g. SCP/rsync), load on remote. Args: image ref, remote host/user/password, optional path. |
| **docker_build_container_local** | Build a Docker image locally (dockerfile path and optional tag as args). Exit 0 on success. |
| **docker_build_container_remote** | Same build on remote host via SSH (e.g. send context or git pull on remote then `docker build`). |

---

### Nginx

| Script | Purpose |
|--------|--------|
| **nginx_check_install_local** | Check if nginx is installed locally (e.g. `command -v nginx` or `nginx -v`). Print true/false; exit 0 if installed. |
| **nginx_check_install_remote** | Same check on remote host via SSH. |
| **nginx_install_local** | Install nginx on the local machine (apt/yum/dnf as per OS). Exit 0 on success. |
| **nginx_install_remote** | Install nginx on remote host via SSH. |
| **nginx_start_local** | Start nginx (e.g. `systemctl start nginx` or `service nginx start`). |
| **nginx_start_remote** | Same, on remote host via SSH. |
| **nginx_stop_local** | Stop nginx on the local machine. |
| **nginx_stop_remote** | Same, on remote host via SSH. |
| **nginx_restart_local** | Restart nginx locally. |
| **nginx_restart_remote** | Same, on remote host via SSH. |
| **nginx_stream_logs_local** | Stream nginx log file(s) (e.g. access.log, error.log) to stdout (e.g. `tail -f`). Optional which log. |
| **nginx_stream_logs_remote** | Same, on remote host; stream remote log content to local stdout. |
| **nginx_fetch_nginx_conf_file_local** | Read local nginx config (e.g. `/etc/nginx/nginx.conf` or site path) and print or save to a given path. |
| **nginx_fetch_nginx_conf_file_remote** | Copy nginx config from remote host to local (SCP or cat over SSH and write locally). |
| **nginx_deploy_nginx_conf_file_local** | Deploy a given config file to local nginx config path, then validate (e.g. `nginx -t`) and reload if valid. |
| **nginx_deploy_nginx_conf_file_remote** | Deploy a local config file to remote host (SCP or write over SSH), validate and reload nginx on remote. |
| **nginx_run_certbot_local** | Run certbot for nginx locally (e.g. obtain/renew certs, nginx plugin if used). Domain and options as args. |
| **nginx_run_certbot_remote** | Same, on remote host via SSH (run certbot on remote for the given domain/options). |

---

### Git

| Script | Purpose |
|--------|--------|
| **git_check_installed_local** | Check if git is installed locally (e.g. `command -v git` or `git --version`). Print true/false; exit 0 if installed. |
| **git_check_installed_remote** | Same check on remote host via SSH. |
| **git_install_local** | Install git on the local machine (apt/yum/dnf as per OS). Exit 0 on success. |
| **git_install_remote** | Install git on remote host via SSH. |
| **git_clone_local** | Run `git clone <repo_url>` locally (optional target path and branch). Use PAC token for auth: pass token via arg or `GIT_PAC_TOKEN` env; embed in URL as `https://<token>@host/repo.git` or use credential helper. Exit 0 on success. |
| **git_clone_remote** | Same, on remote host via SSH: clone repo into given path on remote. Provide PAC token to remote (e.g. env `GIT_PAC_TOKEN` or inject into clone URL over SSH) so clone/pull can authenticate. |
| **git_get_current_branch_local** | Print the current branch name in the local repo (e.g. `git branch --show-current`). Repo path as arg. |
| **git_get_current_branch_remote** | Same, on remote host: run in given repo path on remote and print branch name. |
| **git_checkout_branch_local** | Run `git checkout <branch>` (or `git switch <branch>`) in the local repo. Repo path and branch name as args. Exit 0 on success. |
| **git_checkout_branch_remote** | Same, on remote host: checkout branch in given repo path on remote. |
| **git_pull_update_local** | Run `git pull` (optional branch) in the local repo. Repo path as arg. Use PAC token for auth (arg or `GIT_PAC_TOKEN` env; URL or credential helper). Exit 0 on success. |
| **git_pull_update_remote** | Same, on remote host: pull in given repo path on remote. Provide PAC token to remote (e.g. `GIT_PAC_TOKEN` or clone URL with token) so pull can authenticate. |

---

### Host

| Script | Purpose |
|--------|--------|
| **restart_host_local** | Reboot the local machine (e.g. `systemctl reboot` or `shutdown -r`). Optional delay/cancel; exit 0 when reboot is triggered. |
| **restart_host_remote** | Same, on remote host via SSH: trigger reboot (e.g. `sudo reboot`). Exit 0 when command succeeds. |

---

### Docker (additional)

| Script | Purpose |
|--------|--------|
| **docker_prune_containers_local** | Run `docker container prune -f` (optionally filter by label/state). Remove stopped containers locally. Exit 0 on success. |
| **docker_prune_containers_remote** | Same, on remote host via SSH. |
| **docker_list_volumes_local** | List Docker volumes (e.g. `docker volume ls`); optional format (name, driver, mountpoint). Output to stdout. |
| **docker_list_volumes_remote** | Same, on remote host via SSH. |
| **docker_delete_volume_local** | Remove a Docker volume by name (e.g. `docker volume rm <name>`). Volume name as arg; exit 0 on success. |
| **docker_delete_volume_remote** | Same, on remote host: delete the given volume on remote. |
