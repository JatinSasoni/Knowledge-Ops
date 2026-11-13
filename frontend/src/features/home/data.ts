// Sample content for the home page demos. A fictional support team's handbook.

export type AnswerPart = { text: string; cite?: number };

export type Source = {
  n: number;
  doc: string;
  where: string;
  before: string;
  mark: string;
  after: string;
};

export type DemoQuestion = {
  id: string;
  ask: string;
  answer: AnswerPart[];
  sources: Source[];
  ticket?: { label: string; title: string };
};

const refundWindow: Source = {
  n: 0,
  doc: "Refund policy.pdf",
  where: "page 3",
  before: "Refunds. ",
  mark: "Customers can request a full refund within 30 days of purchase.",
  after:
    " After 30 days, the unused months of an annual plan are turned into store credit instead.",
};

const refundTiming: Source = {
  n: 0,
  doc: "Refund policy.pdf",
  where: "page 3",
  before: "Approved refunds are sent the same day. ",
  mark: "Money goes back to the original payment method and usually arrives within 5 to 10 business days,",
  after: " depending on the customer's bank.",
};

const duplicateCharge: Source = {
  n: 0,
  doc: "Escalation guide.md",
  where: "Billing problems",
  before: "Duplicate charges. ",
  mark: "Escalate to Billing with both invoice numbers attached. Don't send a manual refund until Billing confirms the duplicate,",
  after: " or the customer may be refunded twice.",
};

const annualPlans: Source = {
  n: 0,
  doc: "Refund policy.pdf",
  where: "page 4",
  before: "Annual plans. ",
  mark: "Plans cancelled mid-term are refunded pro rata for the unused full months. The current month is not refunded.",
  after: " Monthly plans are not refunded after renewal.",
};

const withN = (source: Source, n: number): Source => ({ ...source, n });

export const demoQuestions: DemoQuestion[] = [
  {
    id: "timing",
    ask: "How long do refunds take?",
    answer: [
      {
        text: "Refunds go back to the original payment method and usually arrive within 5 to 10 business days.",
        cite: 1,
      },
      { text: " Customers can ask for one within 30 days of purchase.", cite: 2 },
    ],
    sources: [withN(refundTiming, 1), withN(refundWindow, 2)],
  },
  {
    id: "duplicate",
    ask: "A customer was charged twice. What do I do?",
    answer: [
      { text: "Escalate it to Billing with both invoice numbers attached.", cite: 1 },
      {
        text: " Hold off on a manual refund until Billing confirms the duplicate, so the customer isn't refunded twice.",
        cite: 1,
      },
    ],
    sources: [withN(duplicateCharge, 1)],
  },
  {
    id: "annual",
    ask: "Do we refund annual plans mid-term?",
    answer: [
      { text: "Yes, pro rata for the unused full months, but not for the current month.", cite: 1 },
      { text: " After the first 30 days the balance can go to store credit instead.", cite: 2 },
    ],
    sources: [withN(annualPlans, 1), withN(refundWindow, 2)],
  },
  {
    id: "wifi",
    ask: "What's the office Wi-Fi password?",
    answer: [
      {
        text: "I couldn't find this in the Support workspace's documents, so I won't guess. I can file a ticket for IT instead.",
      },
    ],
    sources: [],
    ticket: { label: "File a ticket for IT", title: "Office Wi-Fi password" },
  },
];

// Retrieval demo: passages scored against "How long do refunds take?"

export type ChunkSize = 300 | 500 | 800;

export type Passage = {
  id: string;
  doc: string;
  type: "pdf" | "md";
  index: number;
  sentences: [string, string, string];
  score: Record<ChunkSize, number>;
};

export const workspaces = {
  Support: [
    {
      id: "s1",
      doc: "Refund policy.pdf",
      type: "pdf",
      index: 12,
      sentences: [
        "Money goes back to the original payment method and usually arrives within 5 to 10 business days.",
        "Approved refunds are sent the same day they are approved.",
        "Bank processing times are outside our control; share the refund reference if a customer asks.",
      ],
      score: { 300: 0.88, 500: 0.86, 800: 0.81 },
    },
    {
      id: "s2",
      doc: "Refund policy.pdf",
      type: "pdf",
      index: 11,
      sentences: [
        "Customers can request a full refund within 30 days of purchase.",
        "After 30 days, unused months of an annual plan become store credit.",
        "Refunds for gift purchases go to the person who paid.",
      ],
      score: { 300: 0.74, 500: 0.79, 800: 0.77 },
    },
    {
      id: "s3",
      doc: "Escalation guide.md",
      type: "md",
      index: 4,
      sentences: [
        "If a refund hasn't arrived after 10 business days, escalate to Billing.",
        "Attach the refund reference and the customer's bank name.",
        "Billing replies within one working day.",
      ],
      score: { 300: 0.77, 500: 0.73, 800: 0.68 },
    },
    {
      id: "s4",
      doc: "Annual plans FAQ.md",
      type: "md",
      index: 2,
      sentences: [
        "Annual plans cancelled mid-term are refunded pro rata for unused full months.",
        "The current month is never refunded.",
        "Refunds follow the usual 5 to 10 business day timeline.",
      ],
      score: { 300: 0.61, 500: 0.68, 800: 0.72 },
    },
    {
      id: "s5",
      doc: "Shipping times.pdf",
      type: "pdf",
      index: 6,
      sentences: [
        "Replacement items ship within 2 business days.",
        "Delivery takes 3 to 5 business days within the country.",
        "Customers get a tracking link by email.",
      ],
      score: { 300: 0.57, 500: 0.55, 800: 0.52 },
    },
  ],
  Finance: [
    {
      id: "f1",
      doc: "Expense policy.pdf",
      type: "pdf",
      index: 8,
      sentences: [
        "Approved expense claims are reimbursed with the next payroll run.",
        "Claims submitted after the 20th are paid the following month.",
        "Keep the original receipt for six years.",
      ],
      score: { 300: 0.64, 500: 0.62, 800: 0.59 },
    },
    {
      id: "f2",
      doc: "Vendor payments.md",
      type: "md",
      index: 3,
      sentences: [
        "Vendor invoices are paid on 30-day terms.",
        "Urgent payments need sign-off from the finance lead.",
        "Payments leave our account every Tuesday and Thursday.",
      ],
      score: { 300: 0.54, 500: 0.56, 800: 0.53 },
    },
    {
      id: "f3",
      doc: "Travel policy.pdf",
      type: "pdf",
      index: 15,
      sentences: [
        "Book travel at least 14 days ahead where possible.",
        "Refundable fares need approval from your manager.",
        "Unused tickets must be cancelled before departure.",
      ],
      score: { 300: 0.46, 500: 0.47, 800: 0.44 },
    },
  ],
} satisfies Record<string, Passage[]>;

export type WorkspaceName = keyof typeof workspaces;

export const comparison = {
  columns: ["Knowledge Ops", "A shared drive", "Asking in the team chat"],
  rows: [
    [
      "Finds answers by meaning",
      "Yes, not just matching words",
      "Only titles and exact words",
      "If the right person is online",
    ],
    [
      "Shows where an answer came from",
      "Yes, the exact passage",
      "You open the file and look",
      "Sometimes, as a link",
    ],
    [
      "Says when the answer isn't there",
      "Yes, and files a ticket",
      "Shows no results",
      "Someone replies “not sure”",
    ],
    [
      "Keeps each team's documents apart",
      "Yes, one workspace per team",
      "With folder permissions",
      "Per channel, if people remember",
    ],
    ["Reads PDF, Markdown and text files", "Yes", "Stores them", "As attachments"],
    ["Reads scanned PDFs", "Not yet", "No", "No"],
    ["Answers outside working hours", "Yes", "Yes, if you know the file name", "Rarely"],
  ],
} as const;

export type Faq = { q: string; a: string };

export const faqs: Faq[] = [
  {
    q: "Which files can I add?",
    a: "PDF, Markdown and plain text files. A scanned PDF with no text layer is marked as failed with the reason, so you know to add a text version instead.",
  },
  {
    q: "Who can see my documents?",
    a: "Only members of the workspace they belong to. Every search is limited to one workspace before anything is matched, so one team's files never appear in another team's answers.",
  },
  {
    q: "What if the answer isn't in our documents?",
    a: "It says so instead of guessing, and offers to file a ticket so a person can pick the question up.",
  },
  {
    q: "How does it find the right passage?",
    a: "Each document is split into passages of about 500 tokens, and each passage is stored with a vector that captures its meaning. Your question is matched against those vectors, closest first.",
  },
  {
    q: "How soon can I ask about a new document?",
    a: "As soon as its status changes from Processing to Ready. Documents are read in the background, so you can keep working while they're processed.",
  },
  {
    q: "Who can add or remove people?",
    a: "Workspace admins. Members can read, upload and ask; admins also manage members and settings. A workspace always keeps at least one admin.",
  },
  {
    q: "Where are the files kept?",
    a: "The original file sits in object storage. Its text, passages and their vectors are stored in the workspace's database, so search never leaves your workspace's data.",
  },
];
