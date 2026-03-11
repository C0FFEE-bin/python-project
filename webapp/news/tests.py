from django.test import TestCase
from django.urls import reverse


class NewsViewsTests(TestCase):
    def test_news_index_renders(self):
        response = self.client.get(reverse('news_home'))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'news/index.html')
