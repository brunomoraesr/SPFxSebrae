import * as React from 'react';
import { Link, Stack } from '@fluentui/react';
import styles from './ChatContainer.module.scss';
import { ISource } from '../models/IChatModels';

export interface ISourcesFooterProps {
  sources: ISource[];
}

const SourcesFooter: React.FunctionComponent<ISourcesFooterProps> = (props: ISourcesFooterProps) => {
  const { sources } = props;

  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Stack tokens={{ childrenGap: 4 }} className={styles.sourcesFooter}>
      <span className={styles.sourcesTitle}>Fontes:</span>
      {sources.map((source, index) => (
        <Link key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noreferrer">
          {source.name}
        </Link>
      ))}
    </Stack>
  );
};

export default SourcesFooter;
