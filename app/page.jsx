export default function HomePage() {
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const telegramLink = telegramBotUsername
    ? `https://t.me/${telegramBotUsername}`
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6">
      <div className="max-w-xl rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-10 text-center shadow-sm">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          MenuFlow AI
        </p>
        <h1 className="mb-4 text-4xl font-bold text-[var(--foreground)]">
          Open a menu link from Telegram
        </h1>
        <p className="text-[var(--text-secondary)]">
          Menu creation, profiles, and personalization are managed in Telegram. This website is only
          used to view generated menu pages and personalized menu links.
        </p>
        {telegramLink && (
          <a
            href={telegramLink}
            className="mt-6 inline-flex rounded-lg bg-[var(--primary)] px-5 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
          >
            Open Telegram bot
          </a>
        )}
      </div>
    </main>
  );
}
