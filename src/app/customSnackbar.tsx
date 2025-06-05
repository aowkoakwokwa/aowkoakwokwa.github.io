import React, { forwardRef } from 'react';
import { SnackbarContent, SnackbarContentProps } from 'notistack';
import { CheckCircle, XCircle } from 'lucide-react';

interface CustomSnackbarProps extends SnackbarContentProps {
  message: string;
  variant: 'success' | 'error';
}

const CustomSnackbar = forwardRef<HTMLDivElement, CustomSnackbarProps>(
  ({ message, variant, ...props }, ref) => {
    return (
      <SnackbarContent
        ref={ref}
        role="alert"
        {...props}
        style={{
          backgroundColor: 'white',
          color: variant === 'success' ? '#16a34a' : '#dc2626', // Gunakan warna tailwind
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          minWidth: '250px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {variant === 'success' ? (
            <CheckCircle color="#16a34a" size={20} />
          ) : (
            <XCircle color="#dc2626" size={20} />
          )}
          <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{message}</span>
        </div>
      </SnackbarContent>
    );
  },
);

CustomSnackbar.displayName = 'CustomSnackbar';

export default CustomSnackbar;
