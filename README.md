# פורטל לקוחות (ניהול פרויקטים + בקשות AI על חשבונך)

## הרצה
1. צור פרויקט Supabase והרץ את `supabase/migrations/001_init.sql` (SQL editor).
2. `cp .env.example .env.local` ומלא את הערכים (המפתחות הסודיים רק בשרת).
3. `npm run dev`
4. צור משתמש (Auth → Users), ואז ב-SQL:
   - אדמין: `update profiles set role='admin' where id='<user-id>';`
   - לקוח: `insert into clients(name) values ('שם') returning id;` ואז
     `update profiles set client_id='<client-id>' where id='<user-id>';`

## איך נשלטת העלות
- המפתח של Anthropic רק בשרת; הלקוח לא נוגע בו.
- תקציב חודשי לכל לקוח; כשנוצל - בקשות נכשלות לפני קריאה ל-AI.
- ברירת מחדל: כל בקשה ממתינה לאישורך. אפשר להפעיל "אישור אוטומטי" ללקוח.
- כל קריאה נרשמת ב-`usage_log` (טוקנים + עלות). עדכן מחירים ב-`.env`.
- `AI_MAX_OUTPUT_TOKENS` מגביל כל קריאה.
