// lib
export { cn } from "./lib/utils";

// theme
export { ThemeProvider, useTheme } from "./theme/ThemeProvider";
export { BrandOverride } from "./theme/BrandOverride";
export { themeScript } from "./theme/theme-script";

// fonts
export { inter, bricolage, jetbrains, notoGujarati, notoDevanagari } from "./fonts";

// shadcn ui primitives
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps } from "./components/ui/button";
export { Input } from "./components/ui/input";
export { Label } from "./components/ui/label";
export { Badge, badgeVariants } from "./components/ui/badge";
export { Separator } from "./components/ui/separator";
export { Skeleton } from "./components/ui/skeleton";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./components/ui/tooltip";
export {
  Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "./components/ui/dialog";
export { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";
export { Progress } from "./components/ui/progress";
export { ScrollArea, ScrollBar } from "./components/ui/scroll-area";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./components/ui/accordion";
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup,
  DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuRadioGroup,
} from "./components/ui/dropdown-menu";
export {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton,
} from "./components/ui/select";
export { Textarea } from "./components/ui/textarea";
export { Switch } from "./components/ui/switch";
export { Checkbox } from "./components/ui/checkbox";
export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";
export { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";
export {
  Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose,
  SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,
} from "./components/ui/sheet";
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./components/ui/popover";
export { Slider } from "./components/ui/slider";
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "./components/ui/input-otp";
export { Toaster } from "./components/ui/sonner";

// custom components
export { Money } from "./components/money";
export { FeeBreakdown } from "./components/fee-breakdown";
export type { FeeBreakdownProps, FeeBreakdownLineItem } from "./components/fee-breakdown";
export { StatTile } from "./components/stat-tile";
export { EmptyState } from "./components/empty-state";
export { ErrorState } from "./components/error-state";
export { Field } from "./components/field";
export { PhoneInput } from "./components/phone-input";
export { OtpInput } from "./components/otp-input";
export { LoadingButton } from "./components/loading-button";
export { ConfirmDialog } from "./components/confirm-dialog";
export { DataTable } from "./components/data-table";
export { LangSwitcher } from "./components/lang-switcher";
export { CopyableCode } from "./components/copyable-code";

// special components
export { EventCard } from "./components/event-card";
export { PassCard } from "./components/pass-card";
export { ZoneMap } from "./components/zone-map";
export type { ZoneRegion } from "./components/zone-map";
export { NightCard } from "./components/night-card";
export { ScanResult } from "./components/scan-result";
