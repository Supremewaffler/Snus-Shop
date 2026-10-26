# Snus Shop 24 Telegram bot: setup and use

The bot lets you update the menu on snusshop.pl from Telegram. Changes appear on the site about 30 seconds after you confirm them.

Setup is done once and takes about 15 minutes. You need:
- Telegram
- the GitHub account that owns the website (**supremewaffler**)
- the Vercel account with the snus-shop project

> 🔒 The bot token and the GitHub key are passwords. Only paste them into **Vercel** (step 3). Never paste them into a chat, including the one with Claude.

---

## 1. Create the bot in Telegram (2 min)

1. In Telegram, search for **@BotFather** (it has a blue tick) and tap **Start**.
2. Send `/newbot`.
3. When asked for a **name**, send: `Snus Shop 24`.
4. When asked for a **username**, send something ending in `bot`, for example `SnusShop24Bot`. If it's taken, try another one, like `SnusShop24MenuBot`.
5. BotFather replies with a **token** that looks like `7123456789:AAH…`. Keep this message; you'll need the token in step 3.

## 2. Create a GitHub key (3 min)

This lets the bot save menu changes to the website. The key only works for this one project and can only change its files.

1. On **github.com**, log in as **supremewaffler**.
2. Tap your profile picture → **Settings** → scroll down to **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
3. Fill it in:
   - **Token name:** `snusshop menu bot`
   - **Expiration:** pick the longest option offered, and set a reminder to renew it before then. If it expires, the bot stops saving changes.
   - **Repository access:** **Only select repositories** → choose **Snus-Shop**.
   - **Permissions** → **Repository permissions** → **Contents** → **Read and write**. Leave everything else as it is.
4. Tap **Generate token** and copy the key, which starts with `github_pat_…`. GitHub only shows it once.

## 3. Add the settings to Vercel (3 min)

1. On **vercel.com**, open the **snus-shop** project → **Settings** → **Environment Variables**.
2. Add these two, one at a time. Tick **Production** (and **Preview** if offered), then tap **Save**:

   | Key | Value |
   |---|---|
   | `TELEGRAM_BOT_TOKEN` | the token from step 1 |
   | `GITHUB_TOKEN` | the key from step 2 |

3. Go to **Deployments**, tap **⋯** on the top deployment → **Redeploy**. New settings only apply after a redeploy.

## 4. Connect the bot to the website (1 min)

When the redeploy has finished, open this address in a browser:

**https://www.snusshop.pl/api/telegram?setup**

You should see a line containing `"ok":true`. That means Telegram will now send the bot's messages to the website.

## 5. Choose who can change the menu (3 min)

1. In Telegram, open your bot (search its username) and send `/id`. It replies with your number, e.g. `Twój ID w Telegramie: 123456789`.
2. Your cousin does the same.
3. Back in Vercel → **Settings** → **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `ALLOWED_USERS` | both numbers, separated by a comma, e.g. `123456789,987654321` |

4. **Redeploy** again (Deployments → ⋯ → Redeploy).
5. Send `/pokaz` to the bot. It should reply with the current menu.

Only the people in `ALLOWED_USERS` can change anything. Anyone else gets "Nie masz dostępu" (You don't have access).

## 6. (Optional) Add the bot to your group chat

In the group: **Add members** → search for the bot's username → add it. In a group, the bot only sees messages that start with `/`, so ordinary chat stays private.

---

## Using the bot

| Send | What happens |
|---|---|
| `/menu` followed by the menu on the next lines | Shows a **preview** of the new menu and what changes. Tap **✅ Opublikuj** (Publish) to put it on the site, or **❌ Anuluj** (Cancel). |
| `/wyprzedane cherry` | Marks Cherry as sold out (sticker on the site, can't be ordered). |
| `/dostepne cherry` | Cherry is available again. |
| `/wyprzedane` or `/dostepne` on its own | Shows buttons for every flavour. |
| `/pokaz` | Shows the menu that's on the site now. |
| `/cofnij` | Undoes the last change and restores the previous menu. |
| `/id` | Shows your Telegram ID. |
| `/pomoc` | Help. |

**Menu format:** the same as the one you post on Instagram. Each brand goes on its own line with its strength, and the flavours go under it, one per line, with emoji:

```
/menu
📍 CUBA — 66 mg/g
🍒 Cherry
🍇 Grape
🔥 Banana Hit wyprzedane

📍 KILLA — 12 mg/g
🍇 Grape Ice
```

- Greetings at the top ("cześć, na stocku mamy…") are ignored.
- Writing `wyprzedane` or `❌` next to a flavour adds it as sold out.
- A new menu **replaces** the old one: flavours you leave out disappear from the site.
- If two flavours share a name (e.g. "grape"), the bot asks which one you mean. You can also be more specific, e.g. `/wyprzedane cuba grape`.

## If something doesn't work

- **The bot doesn't answer at all:** open https://www.snusshop.pl/api/telegram?setup again and check it says `"ok":true`. Also check you redeployed after adding the settings.
- **"Nie masz dostępu" (You don't have access):** your ID isn't in `ALLOWED_USERS`, or you didn't redeploy after adding it.
- **"⚠️ Coś poszło nie tak… GitHub 401"** (Something went wrong): the GitHub key has expired or was copied wrong. Make a new one (step 2), update `GITHUB_TOKEN` in Vercel and redeploy.
- **The site still shows the old menu:** wait 30–60 seconds, then reload the page.
