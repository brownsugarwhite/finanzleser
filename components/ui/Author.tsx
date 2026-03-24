import Image from "next/image";

interface AuthorProps {
  name: string;
  role?: string;
  date?: string;
  imageUrl?: string;
}

export default function Author({ name, role = "Autorin bei Finanzleser.de", date, imageUrl }: AuthorProps) {
  return (
    <div className="flex gap-4 items-start">
      {/* Profile Image */}
      {imageUrl && (
        <div className="relative shrink-0 w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Author Info */}
      <div className="flex flex-col gap-1">
        <p style={{ fontSize: "14px", lineHeight: "1.4" }}>
          <span style={{ color: "var(--color-text-medium)" }}>von </span>
          <span style={{ color: "var(--color-text-medium)", fontWeight: "600" }}>
            {name}
          </span>
        </p>
        {role && (
          <p style={{ fontSize: "14px", lineHeight: "1.4", color: "var(--color-text-medium)" }}>
            {role}
          </p>
        )}
        {date && (
          <p style={{ fontSize: "14px", lineHeight: "1.4", color: "var(--color-text-medium)" }}>
            {date}
          </p>
        )}
      </div>
    </div>
  );
}
