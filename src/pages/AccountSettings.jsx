import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Moon, Sun, Trash2, LogOut } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    // Log out and redirect — actual account deletion should be handled by admin/backend
    base44.auth.logout('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-secondary to-primary border-b-2 border-accent px-4 py-3 select-none">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Account Settings
          </h1>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Theme Toggle */}
        <div className="bg-card rounded-xl border border-primary/10 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground text-sm">Appearance</p>
            <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-primary" />}
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => base44.auth.logout('/')}
          className="w-full bg-card rounded-xl border border-primary/10 p-4 flex items-center gap-3 hover:bg-muted/50 transition"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">Sign Out</p>
            <p className="text-xs text-muted-foreground">Log out of your account</p>
          </div>
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full bg-card rounded-xl border border-destructive/20 p-4 flex items-center gap-3 hover:bg-destructive/5 transition"
        >
          <Trash2 className="w-5 h-5 text-destructive" />
          <div className="text-left">
            <p className="font-semibold text-destructive text-sm">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and data</p>
          </div>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-card rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-destructive">Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              This action is <strong>permanent</strong> and cannot be undone. All your pool entries and data will be removed.
            </p>
            <div>
              <label className="block text-xs font-semibold mb-1">Type DELETE to confirm</label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="border-destructive/30 font-mono tracking-widest"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setConfirmText(''); }} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}