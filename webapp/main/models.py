from django.db import models
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

class User(models.Model):
    imie = models.CharField(max_length=50)
    nazwisko = models.CharField(max_length=50)
    email = models.EmailField(unique=True, max_length=120)
    tel_num = models.CharField(max_length=20, blank=True, null=True)
    haslo = models.CharField(max_length=128)
    typ = models.CharField(max_length=20, default="uczen")
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "user"

    def __str__(self):
        return f"{self.imie} {self.nazwisko}"

class Przedmiot(models.Model):
    nazwa = models.CharField(max_length=100)
    temat = models.CharField(max_length=100, blank=True, null=True)
    poziom = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "przedmiot"

    def __str__(self):
        details = [self.nazwa]
        if self.temat:
            details.append(self.temat)
        if self.poziom:
            details.append(self.poziom)
        return " / ".join(details)

class Tutor(models.Model):
    uzytkownik = models.OneToOneField(User, on_delete=models.CASCADE, related_name="tutor_profile")
    opis = models.TextField(blank=True, null=True)
    stawka_godzinowa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    przedmioty = models.ManyToManyField(Przedmiot, related_name="tutorzy", db_table="tutor_przedmiot")
    rating = models.FloatField(blank=True, null=True, default=0)

    class Meta:
        db_table = "tutor"

    def __str__(self):
        return f"Tutor: {self.uzytkownik.imie} {self.uzytkownik.nazwisko}"

class Dostepnosc(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="dostepnosci")
    dzien_tygodnia = models.IntegerField()
    godzina_od = models.TimeField()
    godzina_do = models.TimeField()

    class Meta:
        db_table = "dostepnosc"

    def __str__(self):
        return f"{self.tutor} - dzien {self.dzien_tygodnia} ({self.godzina_od} - {self.godzina_do})"

class Post(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name="posty")
    tytul = models.CharField(max_length=200)
    tresc = models.TextField()
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "post"

    def __str__(self):
        return self.tytul

class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="komentarze")
    uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, related_name="komentarze_uzytkownika")
    tresc = models.TextField()
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "comment"

    def __str__(self):
        return f"Komentarz od {self.uzytkownik.imie} do posta {self.post.id}"

class Opinia(models.Model):
    autor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='opinie_od')
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='opinie_dla')
    rating = models.FloatField()
    tresc = models.TextField()
    data_dodania = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "opinia"

    def __str__(self):
        return f"Opinia ({self.rating}) od {self.autor.imie} dla {self.tutor.uzytkownik.imie}"



@receiver(post_delete, sender='auth.User')
def delete_custom_user(sender, instance, **kwargs):
    if instance.email:
        User.objects.filter(email__iexact=instance.email).delete()

@receiver(post_delete, sender=User)
def delete_auth_user(sender, instance, **kwargs):
    # Lokalny import użyty dopiero w momencie aktywacji sygnału
    from django.contrib.auth.models import User as AuthUser
    if instance.email:
        AuthUser.objects.filter(email__iexact=instance.email).delete()

@receiver(post_save, sender='auth.User')
def sync_user_email(sender, instance, created, **kwargs):
    if not created and instance.email:
        User.objects.filter(imie=instance.username).update(email=instance.email)