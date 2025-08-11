import React from "react";
import { Github, MailIcon, TwitterIcon } from "lucide-react";

interface AppFooterProps {}

const SiteFooter: React.FC<AppFooterProps> = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full mt-16 py-10 border-t border-border bg-background text-foreground">
      <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center lg:items-start gap-8 px-4">
        <div className="flex flex-col gap-4 text-center lg:text-left lg:w-2/5 max-w-lg">
          <h3 className="font-semibold text-primary">
            Zimbabwe Gold Exchange Rates
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An open-source platform to stay updated with real-time ZWG bank
            rates and explore seamless currency conversions.
          </p>
          <div className="flex justify-center lg:justify-start gap-3 mt-2 ">
            <a
              href={"https://twitter.com/icepopsfr"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our Twitter page"
              className="group"
            >
              <div className="w-10 h-10 border-1  bg-card flex items-center justify-center text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <TwitterIcon size={20} />
              </div>
            </a>

            <a
              href={"https://github.com/icep0ps/zimbabwe-bank-rates"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit our GitHub repository"
              className="group"
            >
              <div className="w-10 h-10 bg-card border-1 flex items-center justify-center text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Github size={20} />
              </div>
            </a>

            <a
              href={"mailto:tapsmuko@gmail.com"}
              aria-label="Send us an email"
              className="group"
            >
              <div className="w-10 h-10 border-1 bg-card flex items-center justify-center text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <MailIcon size={20} />
              </div>
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            © {currentYear} Zimbabwe Gold Exchange Rates. All rights reserved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-around w-full lg:w-3/5 gap-8 sm:gap-12 ">
          <nav
            aria-label="Main navigation in footer"
            className="flex flex-col gap-3 text-center sm:text-left w-full sm:w-auto sm:border-l sm:pl-8"
          >
            <h4 className="font-semibold text-lg mb-1">Home</h4>
            <a
              href={"/"}
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Today&apos;s Rate
            </a>
            <a
              href={"/#exchange_rate"}
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Exchange Rates
            </a>
          </nav>

          <nav
            aria-label="Support navigation in footer"
            className="flex flex-col gap-3 text-center sm:text-right w-full sm:w-auto sm:border-l sm:pl-8"
          >
            <h4 className="font-semibold text-lg mb-1">Support</h4>
            <a
              href={"mailto:tapsmuko@gmail.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Contact
            </a>
            <a
              href={"https://github.com/icep0ps/zimbabwe-bank-rates"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Contribute
            </a>
            <a
              href={"/#faq-section"}
              className="text-muted-foreground hover:text-primary transition-colors text-sm"
            >
              Frequently Asked Questions
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
