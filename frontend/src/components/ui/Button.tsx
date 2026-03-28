interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export default function Button({ variant = 'primary', loading, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'btn-primary', // ใช้ class ที่เราเขียนไว้ใน index.css
    secondary: 'px-5 py-2.5 bg-slate-100 text-slate-700 rounded-btn hover:bg-slate-200 transition-all font-medium',
    outline: 'px-5 py-2.5 border border-slate-200 text-slate-600 rounded-btn hover:bg-slate-50 transition-all font-medium'
  };

  return (
    <button 
      disabled={loading}
      className={`${variants[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {loading ? 'กำลังโหลด...' : children}
    </button>
  );
}