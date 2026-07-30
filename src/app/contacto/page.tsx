import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "./form";
import { CAMPUSES, MAIN_CAMPUS, OFFICE_HOURS, ORG, fullAddress } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contacto",
  description: `Teléfonos, correos, direcciones y horarios de atención de las sedes de la ${ORG.legalName} en ${ORG.city}, ${ORG.province}.`,
  alternates: { canonical: "/contacto" },
};

export default function ContactoPage() {
  return (
    <div className="bg-background pb-24">
      <section className="relative bg-brand-lightblue pb-20 pt-32 text-brand-blue">
        <div className="container relative z-10 mx-auto px-6 text-center lg:px-12">
          <p className="mb-4 block text-sm font-bold uppercase tracking-widest">
            Estamos para ayudarte
          </p>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Canales de contacto
          </h1>
          <p className="mx-auto max-w-2xl text-xl font-medium">
            Escribinos o llamanos según la sede y el nivel que te interese. Respondemos consultas de
            admisión, trámites administrativos y pedidos de los equipos directivos.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto grid grid-cols-1 gap-8 px-6 lg:grid-cols-12 lg:gap-16 lg:px-12">
          <div className="flex flex-col gap-12 lg:col-span-7">
            {/* Administración */}
            <div>
              <h2 className="mb-6 border-b border-brand-gray/20 pb-2 text-3xl font-bold text-brand-blue">
                Administración central
              </h2>
              <dl className="flex flex-col gap-6">
                <div className="grid grid-cols-[2.5rem_1fr] items-start gap-x-4">
                  <span
                    className="row-span-2 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green"
                    aria-hidden="true"
                  >
                    <MapPin className="h-5 w-5" />
                  </span>
                  <dt className="font-bold text-brand-blue">Dirección</dt>
                  <dd className="text-sm text-foreground/75">
                    <address className="not-italic">{fullAddress(MAIN_CAMPUS)}</address>
                  </dd>
                </div>

                <div className="grid grid-cols-[2.5rem_1fr] items-start gap-x-4">
                  <span
                    className="row-span-2 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-yellow-dark"
                    aria-hidden="true"
                  >
                    <Phone className="h-5 w-5" />
                  </span>
                  <dt className="font-bold text-brand-blue">Teléfono</dt>
                  <dd className="text-sm">
                    <a
                      href={`tel:${MAIN_CAMPUS.phoneHref}`}
                      className="text-brand-green hover:underline"
                    >
                      {MAIN_CAMPUS.phone}
                    </a>
                  </dd>
                </div>

                <div className="grid grid-cols-[2.5rem_1fr] items-start gap-x-4">
                  <span
                    className="row-span-2 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"
                    aria-hidden="true"
                  >
                    <Mail className="h-5 w-5" />
                  </span>
                  <dt className="font-bold text-brand-blue">Correo institucional</dt>
                  <dd className="text-sm">
                    <a
                      href={`mailto:${MAIN_CAMPUS.email}`}
                      className="break-all text-brand-green hover:underline"
                    >
                      {MAIN_CAMPUS.email}
                    </a>
                  </dd>
                </div>

                <div className="grid grid-cols-[2.5rem_1fr] items-start gap-x-4">
                  <span
                    className="row-span-2 mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gray/15 text-brand-gray-dark"
                    aria-hidden="true"
                  >
                    <Clock className="h-5 w-5" />
                  </span>
                  <dt className="font-bold text-brand-blue">Horarios de atención</dt>
                  <dd className="text-sm text-foreground/75">{OFFICE_HOURS}</dd>
                </div>
              </dl>
            </div>

            {/* Sedes: una tarjeta por escuela, con los mismos datos que el footer */}
            <div>
              <h2 className="mb-6 text-2xl font-bold text-brand-blue">Nuestras sedes</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {CAMPUSES.map((campus) => (
                  <div
                    key={campus.id}
                    className="rounded-2xl border border-brand-gray/15 bg-brand-gray/5 p-6"
                  >
                    <h3 className="text-lg font-bold text-brand-green">{campus.name}</h3>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/70">
                      {campus.levels}
                    </p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <MapPin
                          className="mt-1 h-4 w-4 shrink-0 text-brand-blue"
                          aria-hidden="true"
                        />
                        <address className="not-italic">
                          {campus.street}, {ORG.city}
                        </address>
                      </li>
                      <li className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                        <a
                          href={`tel:${campus.phoneHref}`}
                          className="text-brand-green hover:underline"
                        >
                          {campus.phone}
                        </a>
                      </li>
                      <li className="flex items-start gap-2">
                        <Mail className="mt-1 h-4 w-4 shrink-0 text-brand-blue" aria-hidden="true" />
                        <a
                          href={`mailto:${campus.email}`}
                          className="break-all text-brand-green hover:underline"
                        >
                          {campus.email}
                        </a>
                      </li>
                      {campus.directorsEmail && (
                        <li className="flex items-start gap-2">
                          <Mail
                            className="mt-1 h-4 w-4 shrink-0 text-brand-blue"
                            aria-hidden="true"
                          />
                          <span>
                            <span className="block text-xs font-semibold text-foreground/70">
                              Equipo directivo
                            </span>
                            <a
                              href={`mailto:${campus.directorsEmail}`}
                              className="break-all text-brand-green hover:underline"
                            >
                              {campus.directorsEmail}
                            </a>
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
