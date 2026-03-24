import Image from "next/image";

interface AuthorProps {
  name: string;
  role?: string;
  date?: string;
  imageUrl?: string;
  colorVariant?: 1 | 2 | 3 | 4 | 5 | 6;
}

const gradients = {
  1: "var(--gradient-author-1)", // Instagram
  2: "var(--gradient-author-2)", // Warm Sunset
  3: "var(--gradient-author-3)", // Purple
  4: "var(--gradient-author-4)", // Ocean
  5: "var(--gradient-author-5)", // Spotify Green
  6: "var(--gradient-author-6)", // Hot Pink
};

export default function Author({ name, role = "Autorin bei Finanzleser.de", date, imageUrl, colorVariant = 1 }: AuthorProps) {
  return (
    <div className="flex gap-4 items-start">
      {/* Profile Image with Gradient Border */}
      {imageUrl && (
        <div
          className="relative shrink-0 w-12 h-12 rounded-full p-1 flex-shrink-0"
          style={{
            background: gradients[colorVariant],
          }}
        >
          <div className="relative w-full h-full rounded-full overflow-hidden bg-white">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover"
            />
          </div>
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
