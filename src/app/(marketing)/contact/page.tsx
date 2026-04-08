import { Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  getSupportEmailHref,
  getSupportPhoneHref,
} from "@/lib/support";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-primary">Contact</p>
          <h1 className="text-3xl font-semibold text-foreground">
            We’re here to help
          </h1>
          <p className="text-gray-700">
            Questions about hosting or booking? Drop us a message and we’ll
            reply within one business day.
          </p>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <a
                className="hover:text-primary hover:underline"
                href={getSupportPhoneHref()}
              >
                {SUPPORT_PHONE}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <a
                className="hover:text-primary hover:underline"
                href={getSupportEmailHref()}
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> {SUPPORT_ADDRESS}
            </p>
          </div>
        </div>
        <Card className="border border-border bg-white">
          <CardHeader>
            <CardTitle>Send a message</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
