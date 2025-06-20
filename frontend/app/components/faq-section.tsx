import React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { currencies } from "country-data";

interface FaqSectionProps {
  supportedCurrencies: { name: string }[];
}

const FrequentlyAskedQuestions: React.FC<FaqSectionProps> = ({
  supportedCurrencies,
}) => {
  return (
    <section className="flex flex-col gap-6 py-10" id="faq-section">
      <div className="text-center sm:text-left">
        <h2 className="capitalize text-3xl font-bold text-primary mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-base text-muted-foreground">
          Quick answers to questions you might have. Can't find what you are
          looking for?{" "}
          <a
            href="/contact"
            className="text-primary hover:underline font-medium"
          >
            Contact us.
          </a>{" "}
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full  mx-auto">
        <AccordionItem value="data-source">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
            Where do we get our data?
          </AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground leading-relaxed">
            These values represent the daily average of the Bid and Ask rates
            published by{" "}
            <a
              href="https://www.rbz.co.zw/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary hover:text-primary-foreground transition-colors"
            >
              The Reserve Bank of Zimbabwe
            </a>
            .
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="supported-currencies">
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
            What currencies do we support?
          </AccordionTrigger>
          <AccordionContent>
            {supportedCurrencies.length > 0 ? (
              <ul className="list-disc columns-1 sm:columns-2 lg:columns-3 space-y-1 pl-5 text-base text-muted-foreground">
                {supportedCurrencies.map((curr) => (
                  <li
                    className="break-inside-avoid"
                    key={curr.name + "questions"}
                  >
                    {curr.name} ({currencies[curr.name]?.name ?? "Unknown"})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-muted-foreground">
                Currently, no currency data is available. Please check back
                later.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="data-update-frequency">
          {" "}
          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
            How often does the data update?
          </AccordionTrigger>
          <AccordionContent className="text-base text-muted-foreground leading-relaxed">
            The data is updated daily, typically around{" "}
            <strong>9-10 AM CAT </strong> (Central African Time).
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
};

export default FrequentlyAskedQuestions;
