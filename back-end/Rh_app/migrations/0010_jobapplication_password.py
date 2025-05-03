# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Rh_app', '0009_merge_20250503_1756'),
    ]

    operations = [
        migrations.AddField(
            model_name='jobapplication',
            name='password',
            field=models.CharField(blank=True, max_length=128, null=True),
        ),
    ]
