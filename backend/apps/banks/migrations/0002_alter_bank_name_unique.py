from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("banks", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bank",
            name="name",
            field=models.CharField(max_length=255, unique=True),
        ),
    ]
