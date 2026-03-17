from django.contrib import admin
from .models import Post,User,Tutor,Comment,Dostepnosc,Przedmiot
admin.site.register(User)
admin.site.register(Post)
admin.site.register(Comment)
admin.site.register(Tutor)
admin.site.register(Przedmiot)
admin.site.register(Dostepnosc)

# Register your models here.
