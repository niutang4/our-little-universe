USE love_universe;

INSERT INTO site_settings (id, brand_name, brand_subtitle, eyebrow, hero_title, hero_accent, hero_intro, start_date, start_date_label, secret_code)
VALUES (1, 'Our Little Universe', '给我们的小小星系', '只写给我们', '世界很大，', '但我想把星光都留给你。', '这里先留一块位置，等我们把那些值得记住的日子，一点一点放进来。', NULL, '待补充', '')
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO timeline_items (date_label, title, content, tag, sort_order)
SELECT '待补充', '我们故事的起点', '在这里写下第一次认识、第一次见面，或者你最想记住的开场。', '起点', 1
WHERE NOT EXISTS (SELECT 1 FROM timeline_items LIMIT 1);
INSERT INTO timeline_items (date_label, title, content, tag, sort_order)
SELECT '待补充', '第一次并肩去远方', '一段旅程、一家店、一次临时起意，都值得拥有自己的位置。', '旅行', 2
WHERE (SELECT COUNT(*) FROM timeline_items) = 1;
INSERT INTO timeline_items (date_label, title, content, tag, sort_order)
SELECT '待补充', '一个普通但闪闪发光的日子', '恋爱里最珍贵的，常常是没有特别安排，却一起度过的那天。', '日常', 3
WHERE (SELECT COUNT(*) FROM timeline_items) = 2;
INSERT INTO timeline_items (date_label, title, content, tag, sort_order)
SELECT '未来', '还没有写完的下一章', '把未来留成开放式结尾，等你们一起回来补上。', '未完待续', 4
WHERE (SELECT COUNT(*) FROM timeline_items) = 3;

INSERT INTO gallery_items (category, title, note, image_path, tone, sort_order)
SELECT '全部', '我们第一次的合照', '等待一张照片进入这里', '', 'coral', 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_items LIMIT 1);
INSERT INTO gallery_items (category, title, note, image_path, tone, sort_order)
SELECT '日常', '她笑起来的时候', '那些不需要理由的快乐', '', 'blue', 2
WHERE (SELECT COUNT(*) FROM gallery_items) = 1;
INSERT INTO gallery_items (category, title, note, image_path, tone, sort_order)
SELECT '旅行', '一起去过的地方', '把地图变成我们的收藏夹', '', 'gold', 3
WHERE (SELECT COUNT(*) FROM gallery_items) = 2;
INSERT INTO gallery_items (category, title, note, image_path, tone, sort_order)
SELECT '她的瞬间', '我眼中的她', '只写给她的观察笔记', '', 'lilac', 4
WHERE (SELECT COUNT(*) FROM gallery_items) = 3;
INSERT INTO gallery_items (category, title, note, image_path, tone, sort_order)
SELECT '未来', '下一张照片留给未来', '还没发生，但已经开始期待', '', 'mint', 5
WHERE (SELECT COUNT(*) FROM gallery_items) = 4;

INSERT INTO quiz_questions (question, choices_json, answer_index, sort_order)
SELECT '这里可以换成你们的第一个问题。', '["答案 A","答案 B","答案 C"]', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions LIMIT 1);
INSERT INTO quiz_questions (question, choices_json, answer_index, sort_order)
SELECT '哪一件小事最像你们？', '["临时出发","一起发呆","为了一家店绕路"]', 1, 2
WHERE (SELECT COUNT(*) FROM quiz_questions) = 1;
INSERT INTO quiz_questions (question, choices_json, answer_index, sort_order)
SELECT '下一次想和她一起做什么？', '["去海边","看日落","把三件事都做了"]', 2, 3
WHERE (SELECT COUNT(*) FROM quiz_questions) = 2;

INSERT INTO order_items (label, correct_order, sort_order)
SELECT '第一次认识', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM order_items LIMIT 1);
INSERT INTO order_items (label, correct_order, sort_order)
SELECT '第一次见面', 2, 2 WHERE (SELECT COUNT(*) FROM order_items) = 1;
INSERT INTO order_items (label, correct_order, sort_order)
SELECT '第一次旅行', 3, 3 WHERE (SELECT COUNT(*) FROM order_items) = 2;
INSERT INTO order_items (label, correct_order, sort_order)
SELECT '下一次出发', 4, 4 WHERE (SELECT COUNT(*) FROM order_items) = 3;
