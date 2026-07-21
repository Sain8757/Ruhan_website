import SignatureResizer from "@/components/photo-studio/SignatureResizer";
import PageHeader from "@/components/layout/PageHeader";

export default function ResizeSignaturePage() {
  return (
    <div className="page-shell page-shell-tool">
      <PageHeader
        title="Resize Signature"
        subtitle="Crop, resize, compress to specific KB and download signatures easily."
      />
      <SignatureResizer />
    </div>
  );
}
