export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark millionaire-studio-bg flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}
