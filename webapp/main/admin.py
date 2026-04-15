from django.contrib import admin
from .models import Comment, Dostepnosc, Obserwacja, Opinia, Post, Przedmiot, Tutor, User
admin.site.register(User)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Opinia)
admin.site.register(Tutor)
admin.site.register(Przedmiot)
admin.site.register(Dostepnosc)
admin.site.register(Obserwacja)

# Register your models here.
