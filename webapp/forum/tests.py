from django.test import TestCase


class ForumViewsTests(TestCase):
    def test_forum_pages_render(self):
        index_response = self.client.get('/forum/')
        faq_response = self.client.get('/forum/frequent_questions')

        self.assertEqual(index_response.status_code, 200)
        self.assertEqual(faq_response.status_code, 200)
        self.assertTemplateUsed(index_response, 'forum/index.html')
        self.assertTemplateUsed(faq_response, 'forum/frequent_questions.html')
