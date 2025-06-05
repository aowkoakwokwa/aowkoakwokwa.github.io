import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export default function ChangePassword({ open, close }: { open: boolean; close: () => void }) {
  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        {/* Form atau Input untuk password baru */}
        <p>Enter your new password here.</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} color="primary">
          Cancel
        </Button>
        <Button onClick={() => alert('Password Changed')} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
