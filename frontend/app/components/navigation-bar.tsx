import React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Button } from "~/components/ui/button";
import { MenuIcon } from "lucide-react";

const navLinks = [
  { title: "Home", href: "/" },
  { title: "Exchange Rates", href: "/#exchange_rate" },
  { title: "API (Soon)", href: "/#currency-converter-section" },
  { title: "Contact", href: "/#faq-section" },
];

const NavigationBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background mb-0!">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <a href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold  text-primary">
            Zimbabwe Exchange Rates
          </span>
        </a>

        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          <NavigationMenu>
            <NavigationMenuList>
              {navLinks.map((link) => (
                <NavigationMenuItem key={link.href} className="border-l">
                  <a href={link.href} className={navigationMenuTriggerStyle()}>
                    {link.title}
                  </a>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Toggle mobile menu"
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col pr-0 pt-16">
              <SheetHeader className="absolute top-0 left-0 right-0 p-6 border-b border-border bg-background">
                <SheetTitle className="text-xl font-semibold">
                  Navigation
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="flex w-full items-center py-2 px-4 text-xl font-medium text-foreground hover:text-primary hover:bg-secondary/50 rounded-md transition-colors"
                  >
                    {link.title}
                  </a>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;
