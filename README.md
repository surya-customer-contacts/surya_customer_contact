# Surya Industries — Customer Contact Management System

A web-based customer contact management system built to help Surya Industries organize customer information, manage contact records, and securely handle supporting documents through a centralized dashboard.

## Overview

The Surya Industries Customer Contact Management System provides an organized way to maintain customer and company contact details. Authorized administrators can manage customer records, while customers can submit their details through a public-facing form.

The application uses Supabase for authentication, database storage, and document storage, with a React-based frontend for an interactive user experience.

## Features

- **Admin Authentication:** Secure sign-in for authorized administrators.
- **Customer Management:** Add, view, search, update, and delete customer records.
- **Contact Information:** Maintain company name, contact person, phone numbers, designation, email, category/details, remarks, and contact date.
- **Public Customer Form:** Allow customers to submit their details through a shareable link.
- **Document Management:** Upload and manage supporting files, including images and PDFs, where supported.
- **Document Preview and Download:** View and download customer attachments from the admin dashboard.
- **Database Integration:** Store customer information and document metadata in Supabase.
- **Excel Support:** Import or export customer data where configured in the application.
- **Responsive Interface:** Designed for use on desktop and mobile devices.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Frontend user interface |
| Vite | Development server and build tool |
| Tailwind CSS | Interface styling |
| Supabase | Authentication, PostgreSQL database, and file storage |
| JavaScript | Application functionality |
| Vercel | Frontend deployment |

## Project Structure

```text
surya-customer-contacts/
├── public/
├── src/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

*Note: The structure above is representative. Your actual repository may contain additional files or folders.*

## Prerequisites

Install the following before running the project:

- Node.js (a current supported LTS release is recommended)
- npm
- A Supabase project
- Git (if cloning the repository)

## Local Installation

### 1. Clone the repository

Replace the placeholder below with your actual GitHub repository URL.

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd surya-customer-contacts
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Replace the example values with your project's actual Supabase URL and publishable key.

**Security:** Never commit `.env` files, Supabase service-role keys, passwords, or other private credentials to GitHub. Keep database access controlled through appropriate Supabase Row Level Security (RLS) policies.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173
```

### 5. Create a production build

```bash
npm run build
```

To preview the production build locally, run:

```bash
npm run preview
```

## Supabase Configuration

The application relies on Supabase for its backend services.

Configure the required database tables, authentication settings, storage bucket, and access policies according to the application's implementation.

Expected resources may include:

- `customers` — customer contact records
- `customer_documents` — uploaded document metadata
- `customer-documents` — storage bucket for customer attachments

Keep the document bucket private and configure access policies so that only authorized users can access protected customer information and files. Public form submissions should be restricted to the fields and operations intended for public use.

## Deployment

The frontend can be deployed to Vercel.

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Select **Vite** as the framework if it is not detected automatically.
4. Set the build command to `npm run build`.
5. Set the output directory to `dist`.
6. Add the required Supabase environment variables in Vercel's project settings.
7. Deploy the application.
8. Configure the deployed URL in Supabase Authentication settings if required.

Test administrator authentication, public submissions, document uploads, and database permissions before sharing the deployed website.

## Security and Privacy

- Do not commit secrets or `.env` files.
- Use Supabase RLS policies to protect customer records.
- Keep private documents in a non-public storage bucket.
- Use temporary signed URLs where appropriate for document access.
- Validate public form submissions and restrict public permissions.
- Do not expose administrative service-role credentials in frontend code.

## Future Enhancements

Potential improvements include:

- Advanced customer search and filtering
- Customer activity history
- Improved reporting and analytics
- Additional document management capabilities
- More detailed role-based access control
- Automated backups and operational monitoring

## License

No license has been specified yet. Unless a license is added to this repository, the project should not be assumed to be open-source or freely reusable.

---

**Project:** Surya Industries Customer Contact Management System  
**Purpose:** Centralized customer information and document management  
**Frontend:** React + Vite  
**Backend services:** Supabase
