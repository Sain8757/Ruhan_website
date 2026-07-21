import SignatureResizer from "@/components/photo-studio/SignatureResizer";
import PageHeader from "@/components/layout/PageHeader";

export default function ResizeSignaturePage() {
  return (
    <div className="page-shell">
      <PageHeader
        title="Resize Signature"
        subtitle="Crop, resize, compress to specific KB and download signatures easily."
      />
      <div className="content-grid content-grid-wide">
        <SignatureResizer />
      </div>
    </div>
  );
}
