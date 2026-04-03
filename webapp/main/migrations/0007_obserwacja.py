import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0006_dostepnosc_data_tutor_avatar_tone_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Obserwacja",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tresc", models.CharField(max_length=240)),
                ("data_utworzenia", models.DateTimeField(auto_now_add=True)),
                (
                    "uzytkownik",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="obserwacje",
                        to="main.user",
                    ),
                ),
            ],
            options={
                "db_table": "obserwacja",
            },
        ),
    ]
