const Footer = () => {
  return (
    <footer className="border-t border-border/50 px-6 py-10">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="font-display text-lg font-bold">
          <span className="text-gradient">SAL</span>
        </p>
        <p className="text-muted-foreground text-sm">
          © {new Date().getFullYear()} Smart Accident Link. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
