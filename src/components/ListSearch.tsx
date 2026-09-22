export default function ListSearch({
  action,
  paramName,
  q,
  placeholder,
}: {
  action: string;
  paramName: string;
  q: string;
  placeholder: string;
}) {
  return (
    <form action={action} method="GET" className="mb-4 flex items-center gap-2">
      <input
        type="text"
        name={paramName}
        defaultValue={q}
        placeholder={placeholder}
        className="w-72 text-input"
      />
      <button type="submit" className="btn-secondary">
        Search
      </button>
      {q && (
        <a href={action} className="muted-link">
          Clear
        </a>
      )}
    </form>
  );
}
