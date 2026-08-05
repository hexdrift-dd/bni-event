export type PaymentStatus =
  | "draft"
  | "registered"
  | "payment_submitted"
  | "approved"
  | "rejected";

export type MembershipType = "bni_member" | "non_bni_member";

export interface Registration {
  id: string;
  registration_id: string;
  name: string;
  phone: string;
  email: string;
  membership_type: MembershipType;
  region: string;
  chapter: string;
  district: string | null;
  referred_by: string | null;
  category: string;
  member_count: number;
  amount: number;
  consent_accepted: boolean;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  payment_screenshot_url: string | null;
  razorpay_payment_link_id: string | null;
  razorpay_payment_link_url: string | null;
  razorpay_payment_link_status: string | null;
  razorpay_payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrationInsert {
  registration_id: string;
  name: string;
  phone: string;
  email: string;
  membership_type: MembershipType;
  region: string;
  chapter: string;
  district?: string | null;
  referred_by?: string | null;
  category: string;
  member_count: number;
  amount: number;
  consent_accepted: boolean;
  payment_status?: PaymentStatus;
  payment_reference?: string | null;
  payment_screenshot_url?: string | null;
  notes?: string | null;
}

export interface DashboardMetrics {
  totalRegistrations: number;
  totalMembers: number;
  pendingPayments: number;
  approvedPayments: number;
  rejectedPayments: number;
  paymentSubmitted: number;
  totalExpectedCollection: number;
  totalApprovedCollection: number;
}

export interface RegistrationFilters {
  search?: string;
  chapter?: string;
  paymentStatus?: PaymentStatus | "all";
  dateFrom?: string;
  dateTo?: string;
}
