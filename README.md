# Sanderson Design Group Shopify Theme

## Ubuntu install

Go to https://github.com/Shopify/shopify-cli/releases and grab the latest `.deb` file. Then;

```
sudo apt-get install build-essential ruby-full
sudo apt install /home/jamie/Downloads/shopify-cli-2.18.1.deb
```

(Amend for your home dir and the version you've grabbed.)

Double check Shopify CLI is now installed and available with `shopify version`.

## Mac install

```
brew tap shopify/shopify
brew install shopify-cli
```

### Upgrade shopify-cli

If the CLI moans at you for being out of date, just repeat the above steps without installing `ruby-full`. (If it asks if you want to remove `shopify`, it seems OK to do that.)

## Dev flow

Open theme dir in CLI. Then login first;

`shopify login --store=riva-b2b-m2m-1.myshopify.com`

Then choose `FLAUNT DIGITAL LTD (1968949)`.

Then `shopify theme serve`.

### Dev flow CLI 3.0

Auth seems to be built into the flow, so just do this (not `serve` anymore, use `dev` instead). You only need to specify the store once, seems you can add to an `.env` too if you want.

`shopify theme dev --store=riva-b2b-m2m-1.myshopify.com`

## Deploy

Just push to `master`.