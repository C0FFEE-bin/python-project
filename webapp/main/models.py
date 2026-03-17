from django.db import models

from django.db import models


class User(models.Model):
    imie = models.CharField(max_length=50)
    nazwisko = models.CharField(max_length=50)
    email = models.EmailField(unique=True, max_length=120)
    tel_num = models.CharField(max_length=20, blank=True, null=True)
    haslo = models.CharField(max_length=128)
    typ = models.CharField(max_length=20, default='uczen')
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.imie} {self.nazwisko}"


class Przedmiot(models.Model):
    nazwa = models.CharField(max_length=100)
    poziom = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.nazwa} ({self.poziom})"


class Tutor(models.Model):

    uzytkownik = models.OneToOneField(User, on_delete=models.CASCADE, related_name='tutor_profile')
    opis = models.TextField(blank=True, null=True)
    stawka_godzinowa = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    przedmioty = models.ManyToManyField(Przedmiot, related_name='tutorzy')

    def __str__(self):
        return f"Tutor: {self.uzytkownik.imie} {self.uzytkownik.nazwisko}"


class Dostepnosc(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='dostepnosci')
    dzien_tygodnia = models.IntegerField()
    godzina_od = models.TimeField()
    godzina_do = models.TimeField()

    def __str__(self):
        return f"{self.tutor} - Dzień {self.dzien_tygodnia} ({self.godzina_od} - {self.godzina_do})"


class Post(models.Model):
    tutor = models.ForeignKey(Tutor, on_delete=models.CASCADE, related_name='posty')
    tytul = models.CharField(max_length=200)
    tresc = models.TextField()
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.tytul


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='komentarze')
    uzytkownik = models.ForeignKey(User, on_delete=models.CASCADE, related_name='komentarze_uzytkownika')
    tresc = models.TextField()
    data_utworzenia = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Komentarz od {self.uzytkownik.imie} do posta {self.post.id}"