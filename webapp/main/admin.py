from django.contrib import admin
from .models import Comment, Dostepnosc, Obserwacja, Post, Przedmiot, Tutor, User
admin.site.register(User)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Tutor)
admin.site.register(Przedmiot)
admin.site.register(Dostepnosc)
admin.site.register(Obserwacja)

# Register your models here.
