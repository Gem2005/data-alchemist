# Data Alchemist 🧪

An AI-enabled Next.js web application for intelligent resource allocation configuration. Data Alchemist transforms raw CSV/XLSX data into actionable business rules through an intuitive interface designed for non-technical users.

## 🚀 Features

### Core Functionality
- **File Upload & Parsing**: Support for CSV and XLSX files with intelligent data type detection
- **Interactive Data Grids**: Edit and manage clients, workers, and tasks data with real-time validation
- **Intelligent Validation**: Automated data quality checks with AI-powered suggestions for fixes
- **Business Rule Builder**: Create allocation rules through forms or natural language input
- **Prioritization Engine**: Configure weights and profiles for optimal resource allocation
- **AI Assistant**: Query data, get rule recommendations, and receive intelligent suggestions
- **Export System**: Download cleaned data and export business rules as JSON

### AI-Powered Features
- Natural language to business rules conversion
- Intelligent data parsing and validation
- Smart rule recommendations based on data patterns
- Interactive data querying with natural language
- Automated data quality suggestions

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Data Processing**: PapaParse (CSV), XLSX (Excel)
- **AI Integration**: Azure OpenAI Service
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📁 Project Structure

```
data-alchemist/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Main application layout
│   │   └── page.tsx            # Home page with tabbed interface
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── FileUploadSection.tsx    # File upload and parsing
│   │   ├── DataGridSection.tsx      # Interactive data grids
│   │   ├── ValidationPanel.tsx      # Data validation and fixes
│   │   ├── RuleBuilder.tsx          # Business rule creation
│   │   ├── PrioritizationPanel.tsx  # Weight configuration
│   │   ├── AIAssistant.tsx          # AI-powered features
│   │   └── ExportSection.tsx        # Data and rule export
│   ├── lib/
│   │   └── dataUtils.ts        # Data processing utilities
│   └── types/
│       └── data.ts             # TypeScript type definitions
├── samples/                    # Sample data files
│   ├── clients.csv
│   ├── workers.csv
│   └── tasks.csv
└── .github/
    └── copilot-instructions.md # Development guidelines
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd data-alchemist
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Sample Data
The project includes sample data files in the `samples/` directory:
- `clients.csv`: Sample client data with budgets and priorities
- `workers.csv`: Sample worker data with skills and availability
- `tasks.csv`: Sample task data with requirements and deadlines

## 💡 Usage Guide

### 1. Upload Data
- Navigate to the "Data Upload" tab
- Upload your CSV or XLSX files for clients, workers, and tasks
- Review the automatically detected data structure
- Fix any parsing issues using the validation panel

### 2. Edit and Validate Data
- Use the "Data Management" tab to view and edit your data
- Interactive grids allow inline editing
- Validation panel shows data quality issues and suggestions

### 3. Create Business Rules
- Go to the "Rule Builder" tab
- Use the form builder for structured rules
- Or use natural language input for AI-powered rule creation
- Preview and test rules against your data

### 4. Configure Prioritization
- Visit the "Prioritization" tab
- Adjust weights for different allocation factors
- Create and save prioritization profiles
- Preview how weights affect allocation decisions

### 5. AI Assistant
- Access the AI assistant from any tab
- Ask questions about your data
- Get rule recommendations
- Receive optimization suggestions

### 6. Export Results
- Use the "Export" tab to download processed data
- Export business rules as JSON for integration
- Generate reports and summaries

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for configuration:

```env
# Azure OpenAI Configuration (optional)
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

### Azure OpenAI Integration
The application includes intelligent Azure OpenAI integration for enhanced AI features:

- **Automatic Fallback**: If Azure OpenAI is not configured, the app uses intelligent mock responses
- **Configuration Status**: The UI indicates whether Azure OpenAI is active or using fallback mode
- **Secure Implementation**: API keys are kept server-side for security
- **Error Handling**: Robust error recovery and retry mechanisms

For detailed setup instructions, see [AZURE_OPENAI_INTEGRATION.md](./AZURE_OPENAI_INTEGRATION.md).

### Customization
- Modify validation rules in `src/lib/dataUtils.ts`
- Add new data types in `src/types/data.ts`
- Customize UI components in `src/components/ui/`
- Extend AI features in `src/components/AIAssistant.tsx`

## 🧪 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for async operations
- Follow accessibility guidelines (WCAG)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms
The application can be deployed to any platform supporting Next.js:
- Azure Static Web Apps
- AWS Amplify
- Netlify
- Self-hosted with Docker

## 📊 Features in Detail

### Data Processing
- Intelligent CSV/XLSX parsing with error recovery
- Automatic data type detection and conversion
- Data validation with custom rules
- Duplicate detection and resolution

### Rule Engine
- Form-based rule builder with conditional logic
- Natural language rule input with AI processing
- Rule testing and validation against sample data
- Export rules in multiple formats

### AI Integration
- Azure OpenAI for natural language processing
- Intelligent data analysis and insights
- Automated rule suggestions
- Context-aware help and guidance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)
- [Tailwind CSS](https://tailwindcss.com/)

---

Built with ❤️ using Next.js and AI
