-- One-off: remove an admin reply by matching text (SQL Editor).
-- Adjust the pattern or use the id from: SELECT id, content FROM "AdminComment";

DELETE FROM "AdminComment"
WHERE "targetType" = 'student_comment'
  AND content ILIKE '%what%up%bitch%';
