import { useState } from "react";
import { X, BookOpen, Shield, QrCode, Users } from "lucide-react";

type EducationTopic = "mnemonic" | "guardians" | "qr-consent";

interface EducationModalProps {
  topic: EducationTopic;
  isOpen: boolean;
  onClose: () => void;
}

const educationContent: Record<
  EducationTopic,
  {
    title: string;
    icon: React.ReactNode;
    sections: Array<{ heading: string; content: string }>;
  }
> = {
  mnemonic: {
    title: "Understanding Your Recovery Phrase",
    icon: <Shield className="w-6 h-6" />,
    sections: [
      {
        heading: "What is a Recovery Phrase?",
        content:
          "Your recovery phrase (also called a mnemonic) is a 12-word sequence that acts as your master password. It's used to generate your encryption key, which protects all your medical data.",
      },
      {
        heading: "Why is it Important?",
        content:
          "Your recovery phrase is the ONLY way to recover your encrypted data if you lose access to your device. Without it, your data cannot be decrypted - not even by MediQR staff.",
      },
      {
        heading: "How to Keep it Safe",
        content:
          "Write it down and store it in a secure location (like a safe). Never share it with anyone. Never store it digitally (screenshots, notes apps, etc.). Consider using a password manager's secure notes feature.",
      },
      {
        heading: "What if I Lose it?",
        content:
          "If you lose your recovery phrase, your data cannot be recovered. This is why we recommend setting up social recovery guardians who can help you recover your account.",
      },
    ],
  },
  guardians: {
    title: "Social Recovery Guardians",
    icon: <Users className="w-6 h-6" />,
    sections: [
      {
        heading: "What are Guardians?",
        content:
          "Guardians are trusted individuals (friends, family, or healthcare providers) who can help you recover your account if you lose access. They receive encrypted shards of your recovery key.",
      },
      {
        heading: "How Does it Work?",
        content:
          "Your master encryption key is split into multiple shards using Shamir's Secret Sharing. You need at least 2 out of 3 guardians to recover your account. No single guardian can access your data alone.",
      },
      {
        heading: "Who Should I Choose?",
        content:
          "Choose people you trust completely and who will be available when you need help. They should understand the importance of keeping their shard secure. You can choose friends, family members, or trusted healthcare providers.",
      },
      {
        heading: "Is My Data Safe?",
        content:
          "Yes! Each guardian only receives an encrypted shard. They cannot decrypt your data individually. Only when 2 or more guardians work together can your account be recovered.",
      },
    ],
  },
  "qr-consent": {
    title: "QR Code Consent & Privacy",
    icon: <QrCode className="w-6 h-6" />,
    sections: [
      {
        heading: "What Information is in the QR Code?",
        content:
          "Your QR code contains: your patient ID, a cryptographic fragment (derived from your master key), and a time-limited access token. It does NOT contain your medical records or personal information.",
      },
      {
        heading: "Who Can Scan My QR Code?",
        content:
          "Only authorized medical staff (doctors, paramedics, ER admins) can scan your QR code. They must authenticate with the MediQR system first. Unauthorized scans will be rejected.",
      },
      {
        heading: "What Happens When They Scan?",
        content:
          "When staff scans your QR code, they can access your encrypted medical records. The records are decrypted on their device using the fragment and token. All access attempts are logged for your review.",
      },
      {
        heading: "Can I Revoke Access?",
        content:
          "QR codes expire after 1 hour. You can generate a new QR code at any time, which invalidates the previous one. You can also review all access attempts in your account settings.",
      },
      {
        heading: "Emergency Access",
        content:
          "In emergencies, ER admins can use 'break-glass' access to view your records without scanning your QR code. This requires justification and is logged. You will be notified of any break-glass access.",
      },
    ],
  },
};

export default function EducationModal({
  topic,
  isOpen,
  onClose,
}: EducationModalProps) {
  if (!isOpen) return null;

  const content = educationContent[topic];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-primary">{content.icon}</div>
            <h2 className="text-2xl font-bold">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divider"></div>

        <div className="space-y-6">
          {content.sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">
                {section.heading}
              </h3>
              <p className="text-base-content/80 leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-primary">
            Got it
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

/**
 * Hook to manage education modal state
 */
export function useEducationModal() {
  const [topic, setTopic] = useState<EducationTopic | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (newTopic: EducationTopic) => {
    setTopic(newTopic);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Clear topic after animation
    setTimeout(() => setTopic(null), 200);
  };

  return {
    topic: topic || "mnemonic",
    isOpen,
    openModal,
    closeModal,
  };
}
