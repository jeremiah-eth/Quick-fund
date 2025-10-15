# 🚀 Quick Fund - Crowdfunding Platform

A modern crowdfunding platform built with Next.js, Base Account SDK, and Auto Spend Permissions. Users can create funding proposals, donate to projects, and manage funds with seamless wallet integration.

## ✨ Features

- **🔗 Wallet Integration**: Connect Base Account with Sub Account auto-creation
- **📝 Proposal Creation**: Create detailed funding proposals with categories and tags
- **💰 Donation System**: Easy donation interface with preset amounts
- **🔐 Auto Spend Permissions**: Distribute funds without approval
- **📊 Dashboard**: Track platform statistics and user activity
- **🎨 Modern UI**: Responsive design with Tailwind CSS
- **📱 Mobile Ready**: Works perfectly on all devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Base Account SDK, viem, wagmi
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Base Account wallet

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd quick-fund

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📖 Usage

### 1. Connect Wallet
- Click "Connect Wallet" to connect your Base Account
- Sub Account will be automatically created
- View your addresses and Base Names

### 2. Create Proposals
- Click "Create Proposal" 
- Fill in project details:
  - Title and description
  - Target funding amount
  - Category and tags
  - Optional image and deadline
- Submit your proposal

### 3. Browse & Donate
- View all active proposals
- Filter by category or search
- Click "Donate" to contribute funds
- Leave messages of support

### 4. Manage Funds
- View your created proposals
- Track funding progress
- Use Auto Spend Permissions to distribute funds
- Monitor transaction history

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_APP_NAME="Quick Fund"
NEXT_PUBLIC_APP_DESCRIPTION="Crowdfund projects with Base Account SDK"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_LOGO_URL="https://your-app.vercel.app/logo.png"
```

### Base Account SDK

The app uses Base Account SDK with the following configuration:

```typescript
{
  appName: 'Quick Fund',
  appLogoUrl: 'https://your-app.vercel.app/logo.png',
  appChainIds: [8453], // Base mainnet
  subAccounts: {
    creation: 'on-connect',
    defaultAccount: 'sub',
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
quick-fund/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
│   ├── ClientOnly.tsx     # SSR prevention wrapper
│   ├── DonationModal.tsx  # Donation interface
│   ├── FundingDashboard.tsx # Main dashboard
│   ├── ProposalCard.tsx   # Proposal display
│   ├── ProposalSubmission.tsx # Proposal creation
│   └── WalletConnection.tsx # Wallet integration
├── hooks/                  # Custom React hooks
│   ├── useBaseAccount.ts  # Base Account SDK integration
│   ├── useBaseName.ts     # Base Name resolution
│   └── useReverseBaseName.ts # Reverse resolution
├── lib/                    # Utility libraries
│   ├── baseAccountSDK.ts  # SDK initialization
│   └── mockBaseAccountSDK.ts # Development mock
├── types/                  # TypeScript definitions
│   └── expense.ts         # Data models
└── public/                 # Static assets
```

## 🔒 Security

- **Client-side only**: No backend vulnerabilities
- **Wallet security**: Base Account SDK handles all wallet operations
- **HTTPS enforced**: All connections are secure
- **No sensitive data**: No private keys stored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Base](https://base.org) for the Base Account SDK
- [Vercel](https://vercel.com) for hosting
- [Next.js](https://nextjs.org) for the framework
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

- **Documentation**: [Base Account SDK Docs](https://docs.base.org/base-account/)
- **Issues**: [GitHub Issues](https://github.com/your-username/quick-fund/issues)
- **Discord**: [Base Discord](https://discord.gg/buildonbase)

---

**Built with ❤️ for the Base ecosystem**