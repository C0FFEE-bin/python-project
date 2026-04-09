from django.db import migrations


def clear_custom_user_passwords(apps, schema_editor):
    User = apps.get_model("main", "User")
    User.objects.exclude(haslo="").update(haslo="")


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0009_tutorconversation_tutormessage"),
    ]

    operations = [
        migrations.RunPython(
            clear_custom_user_passwords,
            migrations.RunPython.noop,
        ),
    ]
