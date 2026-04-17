from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("main", "0014_lessonnote"),
    ]

    operations = [
        migrations.AddField(
            model_name="tutor",
            name="avatar_image_url",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name="tutor",
            name="cover_image_url",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
    ]
