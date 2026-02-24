import { useNavigate } from "react-router-dom";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, UserPlus } from "lucide-react";

interface LoginRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
}

const LoginRequiredModal = ({
    isOpen,
    onClose,
    title = "Authentication Required",
    description = "Please log in or create an account to access this feature and enjoy the full MzansiServe experience.",
}: LoginRequiredModalProps) => {
    const navigate = useNavigate();

    const handleLogin = () => {
        onClose();
        navigate("/login");
    };

    const handleRegister = () => {
        onClose();
        navigate("/register");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-center text-slate-500">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Button onClick={handleLogin} className="w-full gap-2">
                        <User className="h-4 w-4" /> Log In
                    </Button>
                    <Button onClick={handleRegister} variant="outline" className="w-full gap-2">
                        <UserPlus className="h-4 w-4" /> Register
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="w-full text-slate-400">
                        Maybe later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LoginRequiredModal;
