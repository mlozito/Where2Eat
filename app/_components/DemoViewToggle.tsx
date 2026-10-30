// Demo only: lets one person see both what the host and a guest see.
export default function DemoViewToggle({
  viewAsGuest,
  onChange,
}: {
  viewAsGuest: boolean;
  onChange: (viewAsGuest: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm text-stone-500">
      <span>Demo: viewing as</span>
      {[false, true].map((guest) => (
        <button
          key={String(guest)}
          type="button"
          onClick={() => onChange(guest)}
          className={`rounded-full px-3 py-1 ${
            viewAsGuest === guest
              ? "bg-stone-800 text-white"
              : "bg-white text-stone-600 hover:bg-stone-100"
          }`}
        >
          {guest ? "Guest" : "Host"}
        </button>
      ))}
    </div>
  );
}
