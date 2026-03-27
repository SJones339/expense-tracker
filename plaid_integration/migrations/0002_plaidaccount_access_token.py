# Generated migration for adding access_token field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plaid_integration', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='plaidaccount',
            name='access_token',
            field=models.CharField(max_length=500, null=True, blank=True),
        ),
    ]

