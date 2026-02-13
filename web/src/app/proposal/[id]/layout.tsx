export default function ProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden">{children}</div>;
}
