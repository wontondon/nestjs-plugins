import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { ClassProvider } from "@nestjs/common/interfaces";
import { SlackConstants } from "./slackConstants";
import { getSlackClient } from "./getSlackClient";
import { createSlackProvider } from "./createSlackProvider";
import {
  SlackOptions,
  SlackAsyncOptions,
  SlackOptionsFactory
} from "./slackOptions";

@Global()
@Module({})
export class SlackCoreModule {
  public static forRoot(options: SlackOptions): DynamicModule {
    const provider = createSlackProvider(options);

    return {
      exports: [provider],
      module: SlackCoreModule,
      providers: [provider]
    };
  }

  static forRootAsync(options: SlackAsyncOptions): DynamicModule {
    const slackProvider: Provider = {
      inject: [SlackConstants.SLACK_MODULE],
      provide: SlackConstants.SLACK_TOKEN,
      useFactory: (slackOptions: SlackOptions) => getSlackClient(slackOptions)
    };

    return {
      exports: [slackProvider],
      imports: options.imports,
      module: SlackCoreModule,
      providers: [...this.createAsyncProviders(options), slackProvider]
    };
  }

  private static createAsyncProviders(options: SlackAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
        inject: [options.inject ?? []]
      } as ClassProvider
    ];
  }

  private static createAsyncOptionsProvider(
    options: SlackAsyncOptions
  ): Provider {
    if (options.useFactory) {
      return {
        inject: options.inject ?? [],
        provide: SlackConstants.SLACK_MODULE,
        useFactory: options.useFactory
      };
    }
    return {
      inject: options.useClass ? [options.useClass] : [],
      provide: SlackConstants.SLACK_MODULE,
      useFactory: (optionsFactory: SlackOptionsFactory) =>
        optionsFactory.createSlackOptions()
    };
  }
}
