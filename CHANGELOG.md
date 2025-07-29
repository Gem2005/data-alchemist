# Changelog

All notable changes to the Data Alchemist project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07-28

### Added
- Initial release of Data Alchemist
- File upload functionality for CSV and XLSX files
- Interactive data grids for clients, workers, and tasks
- Comprehensive data validation with auto-fix suggestions
- Business rule builder with form-based and natural language input
- Prioritization panel with customizable weights and profiles
- AI assistant for data querying and rule recommendations
- Export functionality for cleaned data and business rules
- Sample data files for demonstration
- Comprehensive documentation and setup instructions

### Features
- **Data Processing**: Support for CSV and XLSX file formats with intelligent parsing
- **Data Validation**: Real-time validation with detailed error reporting and suggestions
- **Rule Creation**: Both structured form-based and natural language rule creation
- **AI Integration**: Mock AI responses with hooks for Azure OpenAI integration
- **Export Options**: CSV and JSON export capabilities
- **Modern UI**: Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui
- **Responsive Design**: Mobile-friendly interface with accessible components

### Technical Stack
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui for UI components
- Framer Motion for animations
- Lucide React for icons
- PapaParse for CSV processing
- XLSX for Excel file processing
- Azure OpenAI integration ready

### Project Structure
- Modular component architecture
- Type-safe data handling
- Utility functions for data processing
- Sample data for testing
- Comprehensive documentation
- Development guidelines

### Known Issues
- Production build has file permission issues on Windows (dev server works fine)
- AI features use mock responses (Azure OpenAI integration ready but requires configuration)

### Future Enhancements
- Real Azure OpenAI integration
- Advanced rule validation
- Data visualization charts
- User authentication
- Database persistence
- Advanced export formats
- Batch processing capabilities
