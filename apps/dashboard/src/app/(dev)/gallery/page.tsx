"use client";

import React, { useState } from "react";
import {
  Button,
  Badge,
  Input,
  Label,
  Separator,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
  AvatarFallback,
  Progress,
  Switch,
  Checkbox,
  RadioGroup,
  RadioGroupItem,
  Alert,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Slider,
  Toaster,
  Money,
  StatTile,
  EmptyState,
  ErrorState,
  Field,
  PhoneInput,
  OtpInput,
  LoadingButton,
  ConfirmDialog,
  LangSwitcher,
  CopyableCode,
  EventCard,
  PassCard,
  ZoneMap,
  NightCard,
  ScanResult,
  type ZoneRegion,
} from "@manhar-garba/ui";
import { Inbox } from "lucide-react";
import { toast } from "@manhar-garba/ui";

const ZONES: ZoneRegion[] = [
  { id: "vip", label: "VIP", token: "vip", x: 80, y: 46, width: 140, height: 78, available: true },
  { id: "gold", label: "Gold", token: "gold", x: 40, y: 136, width: 220, height: 88, available: true },
  { id: "general", label: "General", token: "general", x: 20, y: 236, width: 260, height: 108, available: true },
];

export default function GalleryPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [checked, setChecked] = useState(false);
  const [switchVal, setSwitchVal] = useState(false);
  const [radio, setRadio] = useState("season");
  const [progress, setProgress] = useState(60);
  const [lang, setLang] = useState<"en" | "gu" | "hi">("en");
  const [zone, setZone] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [scanState, setScanState] = useState<React.ComponentProps<typeof ScanResult>["state"] | null>(null);

  return (
    <div className="min-h-screen bg-background p-6">
      <Toaster />
      <h1 className="mb-2 font-display text-3xl font-bold text-foreground">Component Gallery</h1>
      <p className="mb-8 text-sm text-muted-foreground">FE-01 design system — all components on mock data</p>

      <Tabs defaultValue="primitives">
        <TabsList className="mb-8">
          <TabsTrigger value="primitives">Primitives</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        {/* ── PRIMITIVES ── */}
        <TabsContent value="primitives" className="space-y-10">
          <Section title="Buttons">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" size="xl">XL (scanner)</Button>
              <Button variant="primary" disabled>Disabled</Button>
              <LoadingButton variant="primary" loading>Loading</LoadingButton>
            </div>
          </Section>

          <Section title="Badges">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="gold">Gold</Badge>
              <Badge variant="zone">Zone</Badge>
            </div>
          </Section>

          <Section title="Avatar & Progress">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>RK</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tickets sold</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </Section>

          <Section title="Stat Tiles">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Tickets Sold" value="1,842" sub="+12% vs yesterday" trend="up" />
              <StatTile label="Revenue" value={<Money paise={484200} />} sub="-3% vs yesterday" trend="down" />
              <StatTile label="Inside Now" value="347" sub="VIP 82 · Gold 189 · Gen 76" trend="neutral" />
              <StatTile label="Tonight Gate Q" value="24" />
            </div>
          </Section>

          <Section title="Accordion">
            <Accordion type="single" collapsible className="max-w-md">
              <AccordionItem value="q1">
                <AccordionTrigger>What is the refund policy?</AccordionTrigger>
                <AccordionContent>Full refund up to 48 hours before the event. No refund after that.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Can I transfer my pass?</AccordionTrigger>
                <AccordionContent>Yes — from your account page before the first night of the event.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>

          <Section title="Slider">
            <div className="max-w-xs space-y-2">
              <Slider min={0} max={100} step={5} defaultValue={[40]} />
            </div>
          </Section>

          <Section title="Separator & Skeleton">
            <div className="space-y-3 max-w-sm">
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          </Section>

          <Section title="CopyableCode & LangSwitcher">
            <div className="flex flex-col gap-4 max-w-sm">
              <CopyableCode value="PASS-7F3K-9021" label="Pass code" />
              <LangSwitcher value={lang} onChange={setLang} />
            </div>
          </Section>
        </TabsContent>

        {/* ── FORMS ── */}
        <TabsContent value="forms" className="space-y-10">
          <Section title="Inputs">
            <div className="max-w-sm space-y-4">
              <Field label="Event name" htmlFor="event-name" required hint="Max 60 characters">
                <Input id="event-name" placeholder="Navratri 2026 – Ahmedabad" />
              </Field>
              <Field label="Phone" htmlFor="phone">
                <PhoneInput value={phone} onChange={setPhone} id="phone" />
              </Field>
              <Field label="OTP" htmlFor="otp">
                <OtpInput value={otp} onChange={setOtp} length={6} />
              </Field>
            </div>
          </Section>

          <Section title="Checkbox, Switch, Radio">
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="terms" checked={checked} onCheckedChange={(v) => setChecked(Boolean(v))} />
                <Label htmlFor="terms">I agree to the terms</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="notif" checked={switchVal} onCheckedChange={setSwitchVal} />
                <Label htmlFor="notif">Enable WhatsApp notifications</Label>
              </div>
              <RadioGroup value={radio} onValueChange={setRadio} className="space-y-2">
                {["season", "weekend", "single"].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <RadioGroupItem value={v} id={v} />
                    <Label htmlFor={v} className="capitalize">{v} pass</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </Section>

          <Section title="Confirm Dialog">
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              Delete event
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              title="Delete event?"
              description="This will permanently delete the event and all passes. This cannot be undone."
              confirmLabel="Delete"
              onConfirm={() => { toast.success("Event deleted (mock)"); setConfirmOpen(false); }}
            />
          </Section>
        </TabsContent>

        {/* ── FEEDBACK ── */}
        <TabsContent value="feedback" className="space-y-10">
          <Section title="Alert">
            <div className="max-w-md space-y-3">
              <Alert>
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>Your event draft is saved. Publish when ready.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Payment failed</AlertTitle>
                <AlertDescription>UPI timeout. Try again or switch to card.</AlertDescription>
              </Alert>
            </div>
          </Section>

          <Section title="Empty & Error States">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="rounded-lg border border-border">
                <EmptyState
                  icon={<Inbox />}
                  title="No passes yet"
                  description="Passes will appear here once attendees purchase them."
                  action={<Button variant="primary" size="sm">Share event link</Button>}
                />
              </div>
              <div className="rounded-lg border border-border">
                <ErrorState
                  title="Could not load sales data"
                  description="Check your connection and try again."
                  action={<Button variant="outline" size="sm">Retry</Button>}
                />
              </div>
            </div>
          </Section>

          <Section title="Toast">
            <div className="flex gap-3">
              <Button variant="primary" size="sm" onClick={() => toast.success("Pass checked in — Rina & Kaushik")}>
                Success toast
              </Button>
              <Button variant="destructive" size="sm" onClick={() => toast.error("Wrong gate — redirect to Gold")}>
                Error toast
              </Button>
            </div>
          </Section>
        </TabsContent>

        {/* ── SPECIAL ── */}
        <TabsContent value="special" className="space-y-10">
          <Section title="EventCard grid">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { title: "Navratri Utsav 2026", city: "Ahmedabad", dates: "2–10 Oct", price: 49900 },
                { title: "Garba Mahotsav", city: "Surat", dates: "3–11 Oct", price: 39900 },
                { title: "Nine Nights Festival", city: "Vadodara", dates: "2–10 Oct", price: 29900 },
                { title: "Royal Garba Night", city: "Rajkot", dates: "4–12 Oct", price: 59900 },
              ].map((e) => (
                <EventCard
                  key={e.title}
                  title={e.title}
                  city={e.city}
                  dateRange={e.dates}
                  priceFromPaise={e.price}
                />
              ))}
            </div>
          </Section>

          <Section title="PassCard states">
            <div className="flex flex-wrap gap-6">
              <PassCard
                state="valid"
                holderName="RINA & KAUSHIK"
                zoneName="Gold"
                zoneColor="hsl(42 96% 58%)"
                admits={2}
                nightRange="Sat 26 Sep – Sun 4 Oct"
                passCode="PASS-7F3K-9021"
                nightBadge="Night 5"
              />
              <PassCard
                state="used-tonight"
                holderName="PRIYA SHAH"
                zoneName="VIP"
                zoneColor="hsl(282 74% 62%)"
                admits={1}
                nightRange="Sat 26 Sep – Sun 4 Oct"
                passCode="PASS-2A9B-4412"
                checkedInAt="8:14 PM"
              />
              <PassCard
                state="refunded"
                holderName="AMIT PATEL"
                zoneName="General"
                zoneColor="hsl(14 92% 56%)"
                admits={4}
                nightRange="Sat 26 Sep – Sun 4 Oct"
                passCode="PASS-3C1D-7823"
                refundedOn="12 Oct"
              />
            </div>
          </Section>

          <Section title="ZoneMap">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <ZoneMap zones={ZONES} selected={zone} onSelect={setZone} className="max-w-[240px]" />
              <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                <p>Selected zone: <strong className="text-foreground">{zone ?? "none"}</strong></p>
                <p>Click a zone to select it.</p>
              </div>
            </div>
          </Section>

          <Section title="NightCard row">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 9 }, (_, i) => (
                <NightCard
                  key={i}
                  nightNumber={i + 1}
                  date={`${26 + i} Sep`}
                  themeName={["White Night", "Red & Gold", "Royal Blue", "Peacock", "Sunrise", "Neon Fest", "Retro Garba", "Silver Night", "Grand Finale"][i] ?? "Night"}
                  dresscode={["White", "Red", "Blue", "Green", "Yellow", "Neon", "Retro", "Silver", "Traditional"][i]}
                  accentColor={[
                    "hsl(14 92% 56%)",
                    "hsl(0 84% 58%)",
                    "hsl(220 80% 55%)",
                    "hsl(152 66% 45%)",
                    "hsl(38 95% 55%)",
                    "hsl(282 74% 62%)",
                    "hsl(320 70% 55%)",
                    "hsl(200 70% 60%)",
                    "hsl(42 96% 58%)",
                  ][i]}
                />
              ))}
            </div>
          </Section>

          <Section title="ScanResult (click to dismiss)">
            <div className="flex flex-wrap gap-2">
              {(["allowed", "allowed_partial", "already_in", "wrong_zone", "wrong_night", "refunded", "blocked", "invalid"] as const).map(
                (s) => (
                  <Button key={s} variant="outline" size="sm" onClick={() => setScanState(s)}>
                    {s}
                  </Button>
                )
              )}
            </div>
            {scanState && (
              <ScanResult
                state={scanState}
                primaryText={
                  scanState === "allowed"
                    ? "RINA & KAUSHIK"
                    : scanState === "allowed_partial"
                    ? "FAMILY PASS"
                    : scanState === "already_in"
                    ? "ALREADY INSIDE"
                    : scanState === "wrong_zone"
                    ? "WRONG GATE"
                    : scanState === "wrong_night"
                    ? "NOT VALID TONIGHT"
                    : scanState === "refunded"
                    ? "REFUNDED"
                    : scanState === "blocked"
                    ? "CALL SUPERVISOR"
                    : "INVALID PASS"
                }
                secondaryText={
                  scanState === "allowed"
                    ? "GOLD · 2 of 2 · Night 5"
                    : scanState === "allowed_partial"
                    ? "1 of 4 entered"
                    : scanState === "already_in"
                    ? "Entered 8:14 PM · Gate 3"
                    : scanState === "wrong_zone"
                    ? "GOLD pass · this is VIP"
                    : scanState === "wrong_night"
                    ? "Valid nights 1–5"
                    : scanState === "refunded"
                    ? "Refunded 12 Oct"
                    : scanState === "blocked"
                    ? "Flagged by supervisor"
                    : "Signature failed"
                }
                onDismiss={() => setScanState(null)}
              />
            )}
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
