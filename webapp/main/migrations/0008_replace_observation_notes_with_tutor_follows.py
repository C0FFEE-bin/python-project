import django.db.models.deletion
from django.db import migrations, models


def clear_existing_observations(apps, schema_editor):
    Obserwacja = apps.get_model("main", "Obserwacja")
    Obserwacja.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0007_obserwacja"),
    ]

    operations = [
        migrations.AddField(
            model_name="obserwacja",
            name="tutor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="obserwacje",
                to="main.tutor",
            ),
        ),
        migrations.RunPython(clear_existing_observations, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="obserwacja",
            name="tresc",
        ),
        migrations.AlterField(
            model_name="obserwacja",
            name="tutor",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="obserwacje",
                to="main.tutor",
            ),
        ),
        migrations.AddConstraint(
            model_name="obserwacja",
            constraint=models.UniqueConstraint(
                fields=("uzytkownik", "tutor"),
                name="unique_tutor_observation_per_user",
            ),
        ),
    ]
