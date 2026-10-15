// Fallback entitlement definitions for the Basic Plan.
// The database row (public.subscription_plan_config) is the live source of
// truth; these constants seed it and cover the page when the query fails.
import type { Entitlement } from "../types";

export const DEFAULT_ENTITLEMENTS: Entitlement[] = [
  {
    key: "social_feed",
    label: "Social Feed Posting",
    description: "Post updates, milestones and announcements in the community feed",
    icon: "MessageSquare",
    actionLabel: "Create a post",
  },
  {
    key: "resource_map",
    label: "Resource Map Posting",
    description: "Publish resources and locations on the global resource map",
    icon: "MapPin",
    actionLabel: "Add a resource",
  },
  {
    key: "open_source_tech",
    label: "Open-Source Technologies",
    description: "Access the SFH open-source technology library",
    icon: "Code2",
    actionLabel: "Browse technologies",
  },
  {
    key: "acceleration_programs",
    label: "Acceleration Programs",
    description: "Apply to SFH accelerator and MVP development programs",
    icon: "Rocket",
    actionLabel: "View programs",
  },
  {
    key: "sfh_discounts",
    label: "SFH Services Discounts",
    description: "Member pricing on Startup Factory Hub services",
    icon: "Percent",
    actionLabel: "See discounts",
  },
  {
    key: "events_access",
    label: "Meetings, Conferences & Pitch Events",
    description: "Access online and in-person meetings, conferences and pitch events",
    icon: "CalendarDays",
    actionLabel: "Browse events",
  },
  {
    key: "investor_contact",
    label: "Investor Access",
    description: "Contact investors directly through the platform",
    icon: "HandCoins",
    actionLabel: "Find investors",
  },
  {
    key: "internships",
    label: "Internships",
    description: "Access internship opportunities inside the SFH network",
    icon: "GraduationCap",
    actionLabel: "Browse internships",
  },
  {
    key: "volunteering",
    label: "Volunteering Roles",
    description: "Join volunteering initiatives and community programs",
    icon: "HeartHandshake",
    actionLabel: "See roles",
  },
  {
    key: "tech_transfer",
    label: "IP & Technology Access",
    description: "Access IP and technologies available for licensing",
    icon: "ArrowLeftRight",
    actionLabel: "Explore transfers",
  },
  {
    key: "certified_courses",
    label: "Certified Courses",
    description: "Enroll in certified courses and earn credentials",
    icon: "BadgeCheck",
    actionLabel: "Start learning",
  },
];
