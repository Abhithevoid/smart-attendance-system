import QRScanner from "../../components/QRScanner";

// Thin wrapper — QRScanner reads :id from useParams itself
export default function ScanPage() {
  return <QRScanner />;
}